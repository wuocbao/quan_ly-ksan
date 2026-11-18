const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const { defineSecret } = require('firebase-functions/params');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');

admin.initializeApp();

const smtpHost = defineSecret('SMTP_HOST');
const smtpPort = defineSecret('SMTP_PORT');
const smtpUser = defineSecret('SMTP_USER');
const smtpPass = defineSecret('SMTP_PASS');
const smtpFrom = defineSecret('SMTP_FROM');

const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[char]));

exports.sendBookingApprovalEmail = onDocumentWritten({
  document: 'bookings/{bookingId}',
  region: 'asia-southeast1',
  secrets: [smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom]
}, async event => {
  const booking = event.data && event.data.after.exists ? event.data.after.data() : null;
  if (!booking || booking.approved !== true || booking.emailStatus !== 'pending') return;

  const bookingRef = event.data.after.ref;
  const claimed = await admin.firestore().runTransaction(async transaction => {
    const snapshot = await transaction.get(bookingRef);
    if (!snapshot.exists || snapshot.data().approved !== true || snapshot.data().emailStatus !== 'pending') {
      return false;
    }
    transaction.update(bookingRef, { emailStatus: 'sending' });
    return true;
  });
  if (!claimed) return;

  const email = String(booking.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    await bookingRef.update({ emailStatus: 'failed' });
    console.error('Booking approval email has no valid recipient', event.params.bookingId);
    return;
  }

  const port = Number(smtpPort.value());
  const transporter = nodemailer.createTransport({
    host: smtpHost.value(),
    port,
    secure: port === 465,
    auth: { user: smtpUser.value(), pass: smtpPass.value() }
  });

  const name = escapeHtml(booking.ten);
  const date = escapeHtml(booking.ngay);
  const room = escapeHtml(booking.assignedRoom);
  const nights = escapeHtml(booking.dem);
  try {
    await transporter.sendMail({
      from: smtpFrom.value(),
      to: email,
      subject: 'Xác nhận đặt phòng - MY HOTEL',
      text: `Xin chào ${booking.ten}, đơn đặt phòng của quý khách đã được lễ tân duyệt.\nPhòng: ${booking.assignedRoom}\nNgày nhận: ${booking.ngay}\nSố đêm: ${booking.dem}\nMã đặt phòng: ${event.params.bookingId}`,
      html: `<p>Xin chào <b>${name}</b>,</p>
        <p>Đơn đặt phòng của quý khách đã được lễ tân duyệt.</p>
        <ul><li>Phòng: <b>${room}</b></li><li>Ngày nhận: <b>${date}</b></li>
        <li>Số đêm: <b>${nights}</b></li></ul>
        <p>Mã đặt phòng: <b>${escapeHtml(event.params.bookingId)}</b></p>
        <p>MY HOTEL kính chúc quý khách có một kỳ nghỉ vui vẻ.</p>`
    });
    await bookingRef.update({
      emailStatus: 'sent',
      emailSentAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    await bookingRef.update({ emailStatus: 'failed' });
    console.error('Could not send booking approval email', event.params.bookingId, error);
  }
});
