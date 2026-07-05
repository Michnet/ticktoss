import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import pdfParse from 'pdf-parse';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ProductSchema = z.object({
  products: z.array(z.object({
    name: z.string().describe("The name or title of the product."),
    short_description: z.string().describe("A brief description of the product."),
    price: z.number().nullable().describe("The original price of the product as a number, or null if unknown."),
    sale_price: z.number().nullable().describe("The discounted sale price as a number, or null if unknown."),
    stock: z.number().default(1).describe("The number of items in stock, default to 1 if unknown."),
    duration_hours: z.number().default(24).describe("The duration of the sale in hours, default to 24."),
    pickup_address: z.string().nullable().describe("The pickup address, or null if unknown."),
    pickup_lat: z.number().nullable().describe("The latitude for pickup, or null if unknown."),
    pickup_lng: z.number().nullable().describe("The longitude for pickup, or null if unknown."),
  }))
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const type = formData.get('type');
    let contentToAnalyze = '';

    if (type === 'url') {
      const url = formData.get('payload');
      const res = await fetch(url);
      const html = await res.text();
      const $ = cheerio.load(html);
      $('script, style, noscript, iframe, img, svg').remove();
      contentToAnalyze = $('body').text().replace(/\s+/g, ' ').trim();
      
      if (contentToAnalyze.length > 20000) {
        contentToAnalyze = contentToAnalyze.substring(0, 20000);
      }
    } else if (type === 'text' || type === 'csv') {
      contentToAnalyze = formData.get('payload');
    } else if (type === 'pdf') {
      const file = formData.get('file');
      if (!file) throw new Error("No PDF file uploaded");
      const buffer = Buffer.from(await file.arrayBuffer());
      const pdfData = await pdfParse(buffer);
      contentToAnalyze = pdfData.text;
      if (contentToAnalyze.length > 20000) {
        contentToAnalyze = contentToAnalyze.substring(0, 20000);
      }
    }

    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an assistant that extracts e-commerce product information from unstructured text, HTML, or CSV into a structured JSON list. Try your best to determine prices (as numbers), names, descriptions, and stock." },
        { role: "user", content: `Extract products from the following content:\n\n${contentToAnalyze}` },
      ],
      response_format: zodResponseFormat(ProductSchema, "products_extraction"),
    });

    const products = completion.choices[0].message.parsed.products;

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
