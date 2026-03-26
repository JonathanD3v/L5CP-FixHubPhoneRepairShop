const nodemailer = require("nodemailer");

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Email templates
const emailTemplates = {
  // Service Request - Assigned to Technician
  serviceAssigned: (data) => ({
    subject: `Your Device Repair - Job #${data.requestNumber}`,
    html: `
      <h2>Your device has been assigned to a technician</h2>
      <p>Dear ${data.customerName},</p>
      <p>Your device (${data.deviceModel}) has been assigned to technician <strong>${data.technicianName}</strong>.</p>
      <p><strong>Estimated Completion:</strong> ${data.estimatedCompletion}</p>
      <p><strong>Job Number:</strong> ${data.requestNumber}</p>
      <p>You can track your repair status using this number.</p>
      <p>We will notify you when your device is ready.</p>
      <br/>
      <p>Thank you for choosing our service!</p>
    `,
  }),

  // Service Request - Completed
  serviceCompleted: (data) => ({
    subject: `Your Device is Ready - Job #${data.requestNumber}`,
    html: `
      <h2>Your device repair is complete!</h2>
      <p>Dear ${data.customerName},</p>
      <p>Your device (${data.deviceModel}) has been repaired and is ready for pickup.</p>
      <p><strong>Total Amount:</strong> $${data.totalAmount}</p>
      <p><strong>Job Number:</strong> ${data.requestNumber}</p>
      <p>Please visit our shop to collect your device.</p>
      <p><strong>Shop Hours:</strong> 9:00 AM - 6:00 PM</p>
      <br/>
      <p>Thank you for choosing our service!</p>
    `,
  }),

  // Order - Confirmed
  orderConfirmed: (data) => ({
    subject: `Order Confirmed - #${data.orderNumber}`,
    html: `
      <h2>Your order has been confirmed!</h2>
      <p>Dear ${data.customerName},</p>
      <p>Your order #${data.orderNumber} has been confirmed.</p>
      <h3>Order Summary:</h3>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr>
          <th>Product</th>
          <th>Quantity</th>
          <th>Price</th>
        </tr>
        ${data.items
          .map(
            (item) => `
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>$${item.price}</td>
          </tr>
        `,
          )
          .join("")}
      </table>
      <p><strong>Total:</strong> $${data.totalAmount}</p>
      <p>We will notify you when your order is ready for pickup.</p>
      <br/>
      <p>Thank you for shopping with us!</p>
    `,
  }),

  // Order - Ready for Pickup
  orderReady: (data) => ({
    subject: `Your Order is Ready - #${data.orderNumber}`,
    html: `
      <h2>Your order is ready for pickup!</h2>
      <p>Dear ${data.customerName},</p>
      <p>Your order #${data.orderNumber} is now ready for pickup.</p>
      <p>Please visit our shop with your order number.</p>
      <p><strong>Shop Hours:</strong> 9:00 AM - 6:00 PM</p>
      <br/>
      <p>Thank you for shopping with us!</p>
    `,
  }),

  // Password Reset
  passwordReset: (data) => ({
    subject: "Password Reset Request",
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${data.resetUrl}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  }),
};

// Send email function
const sendEmail = async (to, type, data) => {
  try {
    const template = emailTemplates[type](data);

    const mailOptions = {
      from: `"${process.env.SHOP_NAME}" <${process.env.EMAIL_FROM}>`,
      to: to,
      subject: template.subject,
      html: template.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email error:", error);
    return { success: false, error: error.message };
  }
};

// Notification triggers
const sendServiceAssignedNotification = async (serviceRequest, technician) => {
  if (!serviceRequest.customerEmail) return;

  await sendEmail(serviceRequest.customerEmail, "serviceAssigned", {
    customerName: serviceRequest.customerName,
    deviceModel: serviceRequest.deviceModel,
    technicianName: technician.name,
    estimatedCompletion: serviceRequest.estimatedCompletionDate,
    requestNumber: serviceRequest.requestNumber,
  });

  // Update notification flag
  await serviceRequest.updateOne({ "notificationSent.assigned": true });
};

const sendServiceCompletedNotification = async (serviceRequest) => {
  if (!serviceRequest.customerEmail) return;

  await sendEmail(serviceRequest.customerEmail, "serviceCompleted", {
    customerName: serviceRequest.customerName,
    deviceModel: serviceRequest.deviceModel,
    totalAmount: serviceRequest.totalAmount,
    requestNumber: serviceRequest.requestNumber,
  });

  await serviceRequest.updateOne({ "notificationSent.completed": true });
};

const sendOrderConfirmedNotification = async (order) => {
  await sendEmail(order.customerEmail, "orderConfirmed", {
    customerName: order.customerName,
    orderNumber: order.orderNumber,
    items: order.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      price: item.unitPrice,
    })),
    totalAmount: order.totalAmount,
  });

  await order.updateOne({ "notificationSent.confirmed": true });
};

const sendOrderReadyNotification = async (order) => {
  await sendEmail(order.customerEmail, "orderReady", {
    customerName: order.customerName,
    orderNumber: order.orderNumber,
  });

  await order.updateOne({ "notificationSent.ready": true });
};

module.exports = {
  sendEmail,
  sendServiceAssignedNotification,
  sendServiceCompletedNotification,
  sendOrderConfirmedNotification,
  sendOrderReadyNotification,
};
