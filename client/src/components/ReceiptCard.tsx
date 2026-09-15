// components/ReceiptCard.tsx
interface ReceiptCardProps {
  fullName: string;
  email: string;
  amount: number;
  cart: any[];
  txRef?: string;
}

const ReceiptCard = ({ fullName, email, amount, cart, txRef = "Pending" }: ReceiptCardProps) => {
  return (
    <div className="bg-gray-50 border rounded-lg p-6 shadow">
      <h3 className="text-lg font-semibold mb-4">📃 Receipt (Preview)</h3>

      <p className="text-sm text-gray-700 mb-1"><strong>Name:</strong> {fullName}</p>
      <p className="text-sm text-gray-700 mb-1"><strong>Email:</strong> {email}</p>
      <p className="text-sm text-gray-700 mb-1"><strong>Tx Ref:</strong> {txRef}</p>
      <p className="text-sm text-gray-700 mb-4"><strong>Date:</strong> {new Date().toLocaleString()}</p>

      <ul className="divide-y text-sm text-gray-600">
        {cart.map((item, i) => (
          <li key={i} className="flex justify-between py-1">
            <span>{item.title}</span>
            <span>${item.price}</span>
          </li>
        ))}
      </ul>

      <div className="flex justify-between font-semibold text-[#1c2b21] mt-4 border-t pt-2">
        <span>Total</span>
        <span>${amount.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default ReceiptCard;
