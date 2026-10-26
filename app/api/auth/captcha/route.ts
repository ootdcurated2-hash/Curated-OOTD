import { NextResponse } from "next/server";

export async function GET() {
  // Buat pertanyaan matematika sederhana dan seru (misal: penjumlahan atau perkalian kecil)
  const num1 = Math.floor(Math.random() * 9) + 1; // 1 - 9
  const num2 = Math.floor(Math.random() * 9) + 1; // 1 - 9
  const isPlus = Math.random() > 0.3; // 70% penjumlahan, 30% perkalian
  
  const question = isPlus ? `${num1} + ${num2}` : `${num1} × ${num2}`;
  const answer = isPlus ? num1 + num2 : num1 * num2;

  // Encode jawaban dan timestamp ke token
  const token = Buffer.from(`${answer}:${Date.now()}`).toString("base64");

  return NextResponse.json({
    question,
    token,
  });
}
