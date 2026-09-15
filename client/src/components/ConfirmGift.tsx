import { useState } from "react";
import axios from "axios";
import BASE_URL from "../api/api";

interface ConfirmGiftProps {
  giftId: string; // Pass this as a prop
}

const ConfirmGift: React.FC<ConfirmGiftProps> = ({ giftId }) => {
  const [giftCode, setGiftCode] = useState("");
  const [message, setMessage] = useState("");

  const handleConfirm = async () => {
    if (!giftId || !giftCode) {
      setMessage("Gift ID and code are required");
      return;
    }

    console.log("Sending confirmation for Gift ID:", giftId, "with code:", giftCode);

    try {
      const response = await axios.post(
        `${BASE_URL}/gifts/${giftId}/confirm-gift`,
        { code: giftCode }
      );

      console.log("Response:", response.data);
      setMessage(response.data.msg);
    } catch (error: any) {
      console.error("Confirmation error:", error.response || error);
      setMessage(
        error.response?.data?.msg || "An error occurred during confirmation"
      );
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter gift code"
        value={giftCode}
        onChange={(e) => setGiftCode(e.target.value)}
      />
      <button onClick={handleConfirm}>Confirm Gift</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default ConfirmGift;


