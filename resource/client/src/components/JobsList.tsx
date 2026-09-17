import { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../api/api";
import { useNavigate } from "react-router-dom";

interface Job {
  _id: string;
  title: string;
  description: string;
  location: string;
  employmentModel: string;
  specialization: string;
  createdAt: string;
}

const JobsList = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/jobs`);
        setJobs(response.data);
      } catch (err) {
        setError("Failed to fetch jobs");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (loading) return <p className="text-center py-10 text-gray-500">Loading jobs...</p>;
  if (error) return <p className="text-center text-red-600 py-10">{error}</p>;

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto">
      {jobs.length === 0 ? (
        <p className="text-center text-gray-600">No jobs available</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition duration-300 p-6 flex flex-col justify-between border border-gray-100"
            >
              <div>
                <h2 className="text-2xl font-semibold text-black mb-2">{job.title}</h2>
                <p className="text-sm text-gray-500 mb-1">
                  <span className="font-semibold text-gray-700">📍 Location:</span>{" "}
                  {job.location || "Not specified"}
                </p>
                <p className="text-sm text-gray-500 mb-1">
                  <span className="font-semibold text-gray-700">🕒 Employment:</span>{" "}
                  {job.employmentModel}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  <span className="font-semibold text-gray-700">🎯 Specialization:</span>{" "}
                  {job.specialization}
                </p>
                <p className="text-gray-600 text-sm line-clamp-3">
                  {job.description || "No description provided"}
                </p>
              </div>
              <button
                className="mt-6 bg-green hover:bg-blue-700 text-gold font-semibold py-2 px-4 rounded-lg transition"
                onClick={() => navigate(`/career/${job._id}`)}
              >
                Apply Now
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobsList;



