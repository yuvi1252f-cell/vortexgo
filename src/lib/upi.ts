import QRCode from "qrcode";

export function upiUri(upiId: string, payee: string, amount: number, note: string) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payee,
    am: String(amount),
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

export async function upiQrDataUrl(uri: string) {
  return QRCode.toDataURL(uri, {
    width: 520,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#0b0814", light: "#ffffff" },
  });
}

export function fmtClock(seconds: number) {
  const s = Math.max(0, seconds);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
