import { useEffect, useState } from "react";
import axios from "axios";

interface Referral {
  fullName: string;
  email: string;
  referralCode: string;
  referralClicks: number;
  membership: string;
  membershipId: string;
  role: string;
}

export default function ReferralsDashboard() {
  const [referrals, setReferrals] = useState<Referral[]>([]);

  useEffect(() => {
    axios
      .get("/api/admin/referrals") // make sure baseURL is set in axios
      .then((res) => setReferrals(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h2>Referral Dashboard</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Membership</th>
            <th>Membership ID</th>
            <th>Referral Code</th>
            <th>Clicks</th>
          </tr>
        </thead>
        <tbody>
          {referrals.map((user) => (
            <tr key={user.referralCode}>
              <td>{user.fullName}</td>
              <td>{user.email}</td>
              <td>{user.membership}</td>
              <td>{user.membershipId}</td>
              <td>{user.referralCode}</td>
              <td>{user.referralClicks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
