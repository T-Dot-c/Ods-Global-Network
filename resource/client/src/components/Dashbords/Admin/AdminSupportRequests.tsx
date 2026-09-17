import { useEffect, useState } from "react";
import BASE_URL from "../../../api/api";

type SupportRequest = {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
};

const AdminSupportRequests = () => {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/support`)
      .then((res) => res.json())
      .then((data) => setRequests(data))
      .catch((err) => console.error("Error fetching support requests", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center text-[#1c2b21]">
        Support Requests
      </h1>

      {loading ? (
        <p className="text-center text-gray-600">Loading...</p>
      ) : requests.length === 0 ? (
        <p className="text-center text-gray-500">
          No support requests found.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((req) => (
            <div
              key={req._id}
              className="border border-gray-200 rounded-xl shadow-md p-5 bg-white hover:shadow-lg transition"
            >
              <div className="mb-3">
                <p className="font-semibold text-lg text-[#1c2b21]">{req.subject}</p>
                <p className="text-sm text-gray-500">
                  Submitted {new Date(req.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <p>
                  <strong>Name:</strong> {req.name}
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  <a
                    href={`mailto:${req.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {req.email}
                  </a>
                </p>
                <p className="text-gray-700">
                  <strong>Message:</strong> {req.message}
                </p>
              </div>

              {/* Reply Button */}
              <div className="mt-4">
                <a
                  href={`mailto:${req.email}?subject=Re: ${encodeURIComponent(
                    req.subject
                  )}`}
                  className="inline-block w-full text-center bg-[#1c2b21] text-white px-4 py-2 rounded-lg hover:bg-[#0f1a14] transition"
                >
                  Reply via Email
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSupportRequests;

