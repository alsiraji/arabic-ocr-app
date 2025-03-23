"use client";
import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import Tesseract from "tesseract.js";
import { SketchPicker } from "react-color";
import { ReactSketchCanvas } from "react-sketch-canvas";

export default function DigitsPage() {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const canvasRef = useRef<typeof ReactSketchCanvas | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    setImage(URL.createObjectURL(file));
    processImage(file);
  };
  const processImage = async (file: File) => {
    setLoading(true);
    try {
      // Preprocess the image (e.g., blur and sharpen edges)
      const preprocessedImage = await preprocessImage(file); 
  
      const { data: { text } } = await Tesseract.recognize(
        preprocessedImage,
        'eng', // Specify English language
        { 
          logger: (m: any) => console.log(m),
          tessedit_char_whitelist: '0123456789', // Only recognize digits
        } as any // Fix type error
      );
  
      setText(text);
    } catch (error) {
      console.error("OCR Error:", error);
    } finally {
      setLoading(false); 
    }
  };
  const preprocessImage = async (file: File): Promise<string> => {
    const img = new window.Image();
    img.src = URL.createObjectURL(file);

    return new Promise((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size to the image size
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the image on the canvas
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Apply Gaussian blur
          ctx.filter = 'blur(2px)';
          ctx.drawImage(canvas, 0, 0);

          // Apply edge detection (simple example using convolution)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const width = imageData.width;
          const height = imageData.height;

          const edgeDetectionKernel = [
            -1, -1, -1,
            -1,  8, -1,
            -1, -1, -1
          ];

          const applyKernel = (x: number, y: number) => {
            let r = 0, g = 0, b = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const px = (y + ky) * width + (x + kx);
                const weight = edgeDetectionKernel[(ky + 1) * 3 + (kx + 1)];
                r += data[px * 4] * weight;
                g += data[px * 4 + 1] * weight;
                b += data[px * 4 + 2] * weight;
              }
            }
            return [r, g, b];
          };

          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              const [r, g, b] = applyKernel(x, y);
              const index = (y * width + x) * 4;
              data[index] = r;
              data[index + 1] = g;
              data[index + 2] = b;
            }
          }

          ctx.putImageData(imageData, 0, 0);
        }

        resolve(canvas.toDataURL('image/png'));
      };
    });
  };

  const handleSketchProcess = async () => {
    if (canvasRef.current) {
      const saveData = await canvasRef.current.exportImage("png");
      const response = await fetch(saveData);
      const blob = await response.blob();
      processImage(new File([blob], "sketch.png", { type: "image/png" }));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <motion.h1
        className="text-3xl font-bold mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Handwritten Digits Detection
      </motion.h1>
      <Card className="w-full max-w-md p-6 shadow-lg bg-white rounded-2xl">
        <CardContent className="flex flex-col items-center">
          <ReactSketchCanvas
            ref={canvasRef}
            strokeColor="#000"
            strokeWidth={3}
            width="300px"  // Updated width
            height="200px"  // Updated height
            className="border rounded-lg mb-4"
          />
          <Button className="mb-4" onClick={handleSketchProcess}>
            Process Sketch
          </Button>
          <span className="text-gray-600">OR</span>
          {image ? (
            <Image src={image} alt="Uploaded preview" width={300} height={200} className="rounded-lg mt-4" />
          ) : (
            <label className="cursor-pointer flex flex-col items-center p-6 border-2 border-dashed rounded-xl mt-4">
              <UploadCloud className="w-10 h-10 text-gray-400" />
              <span className="text-gray-600 mt-2">Upload an Image</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          )}
          {loading ? (
            <p className="mt-4 text-gray-600">Processing...</p>
          ) : text && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg w-full text-center">
              <p className="text-gray-700">Detected Digits: {text}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}