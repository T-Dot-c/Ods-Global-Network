import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import BASE_URL from '../api/api';

interface DecodedToken {
  exp: number;
  [key: string]: any;
}

interface ProviderStats {
  totalServices: number;
  pendingOrders: number;
  totalRevenue: number;
  activeCustomers: number;
}

interface RecentOrder {
  id: number;
  recipientName: string;
  recipientPhone: string;
  message: string;
  amount: number;
  status: string;
  createdAt: string;
  serviceName: string;
  senderName: string;
}

export const useProviderStats = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ProviderStats>({
    totalServices: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    activeCustomers: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper: Check if token is expired
  const isTokenExpired = (token: string): boolean => {
    if (!token) return true;
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      if (!decoded || !decoded.exp) return false;
      const now = Date.now() / 1000;
      return decoded.exp < now;
    } catch {
      return false;
    }
  };

  // Helper: Get token and validate
  const getValidToken = (): string | null => {
    const token = localStorage.getItem('token') || JSON.parse(localStorage.getItem('user') || '{}').token;
    if (!token) return null;
    
    if (isTokenExpired(token)) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('providerId');
      navigate('/login');
      return null;
    }
    
    return token;
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getValidToken();
      if (!token) {
        setError('Please log in to view stats');
        return;
      }

      const response = await fetch(`${BASE_URL}/provider/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ msg: 'Request failed' }));
        
        // Handle token expiration
        if (response.status === 401 && errorData.msg?.includes('expired')) {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('providerId');
          navigate('/login');
          return;
        }
        
        throw new Error(errorData.msg || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setStats(data.data || data);
    } catch (err) {
      console.error('Error fetching provider stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const token = getValidToken();
      if (!token) return;

      const response = await fetch(`${BASE_URL}/provider/orders?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Handle token expiration silently for this call
        if (response.status === 401) {
          return;
        }
        throw new Error('Failed to fetch recent orders');
      }

      const data = await response.json();
      setRecentOrders(data.data || []);
    } catch (err) {
      console.error('Error fetching recent orders:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRecentOrders();
  }, []);

  return {
    stats,
    recentOrders,
    loading,
    error,
    refetch: fetchStats
  };
};
