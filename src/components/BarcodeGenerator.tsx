import Barcode from 'react-barcode';

interface BarcodeGeneratorProps {
  value: string;
}

export default function BarcodeGenerator({ value }: BarcodeGeneratorProps) {
  if (!value) return null;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
      <Barcode value={value} width={2} height={100} displayValue={true} />
      <p className="mt-4 text-sm text-slate-500 text-center">
        Diesen Barcode kannst du ausdrucken und an deine Artikel (z.B. Kabel) anbringen.
      </p>
    </div>
  );
}
