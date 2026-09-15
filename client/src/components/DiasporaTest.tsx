import { useDiasporaStats } from '../hooks/useDiasporaStats';

const DiasporaTest = () => {
  const { stats, loading, error } = useDiasporaStats();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#0f285b] mb-4">Diaspora Dashboard Test</h1>
      
      {loading && <p className="text-[#be9b49]">Loading...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-white p-4 border border-[#be9b49] rounded">
          <h3 className="font-bold text-[#0f285b]">Gifts Sent</h3>
          <p className="text-[#be9b49] text-xl">{stats.totalGiftsSent}</p>
        </div>
        <div className="bg-white p-4 border border-[#be9b49] rounded">
          <h3 className="font-bold text-[#0f285b]">Amount Sent</h3>
          <p className="text-[#be9b49] text-xl">${stats.totalAmountSent}</p>
        </div>
        <div className="bg-white p-4 border border-[#be9b49] rounded">
          <h3 className="font-bold text-[#0f285b]">Connections</h3>
          <p className="text-[#be9b49] text-xl">{stats.activeConnections}</p>
        </div>
        <div className="bg-white p-4 border border-[#be9b49] rounded">
          <h3 className="font-bold text-[#0f285b]">Events</h3>
          <p className="text-[#be9b49] text-xl">{stats.communityEvents}</p>
        </div>
      </div>
    </div>
  );
};

export default DiasporaTest;

