const tableRow = (label, value) => `
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; font-size:14px; margin-bottom:8px;">
  <tr>
    <td width="35%" style="padding:8px; background:#f7f7f7; color:#555; font-weight:600; border:1px solid #e5e5e5;">
      ${label}
    </td>
    <td width="65%" style="padding:8px; color:#333; border:1px solid #e5e5e5;">
      ${value || "-"}
    </td>
  </tr>
</table>
`;

export const htmlContentShipment = ({ customer, shipment }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Shipment Created</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f7fa; font-family: Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f7fa; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
          <tr>
            <td style="background:#F15A22; padding:16px; text-align:center; color:#ffffff;">
              <h1 style="margin:0; font-size:20px; font-weight:600;">Shipment Created Successfully</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px; color:#333333;">
              <p style="margin:0 0 12px; font-size:16px;">Hi <strong>${customer.firstName}</strong>,</p>
              <p style="margin:0 0 20px; font-size:14px; line-height:1.6; color:#555;">Your shipment has been successfully created. Below are the complete details for your reference.</p>
              <h2 style="font-size:16px; margin:24px 0 12px; color:#F15A22;">Customer Details</h2>
              ${tableRow("Name", `${customer.firstName} ${customer.lastName || ""}`)}
              ${tableRow("Email", customer.email)}
              ${tableRow("Phone", customer.phone || "-")}
              ${tableRow("Address", customer.address || "-")}
              <h2 style="font-size:16px; margin:24px 0 12px; color:#F15A22;">Shipment Details</h2>
              ${tableRow("Shipment Code", shipment?.shipmentCode)}
              ${tableRow("Status", shipment?.shipmentStatus?.currentStatus || "Created")}
              ${tableRow("Dimensions (L x B x H)", `${shipment.length} ${shipment.unitOfMeasurement} x ${shipment.breadth} ${shipment.unitOfMeasurement} x ${shipment.height} ${shipment.unitOfMeasurement}`)}
              ${tableRow("Weight", `${shipment.weight} ${shipment.selectedService?.weightUnit}`)}
              ${tableRow("Origin", `${shipment.origin?.countryName} (${shipment.origin?.countryCode})`)}
              ${tableRow("Currency", shipment.origin?.currency)}
              <h2 style="font-size:16px; margin:24px 0 12px; color:#F15A22;">Service & Payment</h2>
              ${tableRow("Service Type", shipment.selectedService?.serviceTypeName)}
              ${tableRow("Rate Type", shipment.selectedService?.rateType)}
              ${tableRow("Payment Method", "Paid")}
              ${tableRow("Total Amount", `${shipment.origin?.currency} ${shipment.totalAmount}`)}
              <p style="margin:24px 0 0; font-size:14px; color:#555;">Thank you for choosing <strong>24H Cargo</strong>. If you have any questions, feel free to contact our support team.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f1f1f1; padding:16px; text-align:center; font-size:12px; color:#777;">&copy; 2026 24H Cargo. All rights reserved.</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
