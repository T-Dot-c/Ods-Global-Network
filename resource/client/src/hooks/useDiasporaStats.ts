import { useState, useEffect } from 'react';
import BASE_URL from '../api/api';

export const useDiasporaStats = () => {
  const [stats, setStats] = useState({
    totalGiftsSent: 0,
    totalAmountSent: 0,
    activeConnections: 0,
    communityEvents: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get token from localStorage
      const userData = localStorage.getItem('user');
      const token = userData ? JSON.parse(userData).token : localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('🔍 Fetching diaspora stats with token:', token ? 'Present' : 'Missing');
      console.log('🔍 API URL:', `${BASE_URL}/api/diaspora/stats`);

      const response = await fetch(`${BASE_URL}/api/diaspora/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`Failed to fetch diaspora stats: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Diaspora stats fetched successfully:', data);
      setStats(data);
    } catch (err) {
      console.error('❌ Error fetching diaspora stats:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, error, refetch: fetchStats };
};

export const useDiasporaActivity = () => {
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userData = localStorage.getItem('user');
      const token = userData ? JSON.parse(userData).token : localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${BASE_URL}/api/diaspora/activity`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch diaspora activity: ${response.status}`);
      }

      const data = await response.json();
      setActivity(data);
    } catch (err) {
      console.error('Error fetching diaspora activity:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  return { activity, loading, error, refetch: fetchActivity };
};

export const useDiasporaEvents = (): { events: any[]; loading: boolean; error: string | null; refetch: () => void } => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userData = localStorage.getItem('user');
      const token = userData ? JSON.parse(userData).token : localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${BASE_URL}/api/diaspora/events`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch diaspora events: ${response.status}`);
      }

      const data = await response.json();
      setEvents(data);
    } catch (err) {
      console.error('Error fetching diaspora events:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return { events, loading, error, refetch: fetchEvents };
};

export const useDiasporaCauses = (): { causes: any[]; loading: boolean; error: string | null; refetch: () => void } => {
  const [causes, setCauses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCauses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userData = localStorage.getItem('user');
      const token = userData ? JSON.parse(userData).token : localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${BASE_URL}/api/diaspora/causes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch diaspora causes: ${response.status}`);
      }

      const data = await response.json();
      setCauses(data);
    } catch (err) {
      console.error('Error fetching diaspora causes:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCauses();
  }, []);

  return { causes, loading, error, refetch: fetchCauses };
};

