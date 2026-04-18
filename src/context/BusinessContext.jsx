import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { makeApiClient } from '../api/client';

const EMPTY = { business_name: '', location: '', category: '' };

const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [sentimentBusiness, setSentimentBusiness] = useState(EMPTY);
  const [historyBusiness, setHistoryBusiness] = useState(EMPTY);
  const [companies, setCompanies] = useState([]);

  const fetchCompanies = (api) => {
    api('/data-retrieval/companies')
      .then((r) => r.json())
      .then((data) => setCompanies(data.companies ?? []))
      .catch(() => {});
  };

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    fetchCompanies(makeApiClient(token));
  }, [isAuthenticated, token]);

  const refreshCompanies = () => {
    if (!token) return;
    fetchCompanies(makeApiClient(token));
  };

  return (
    <BusinessContext.Provider value={{ sentimentBusiness, setSentimentBusiness, historyBusiness, setHistoryBusiness, companies, refreshCompanies }}>
      {children}
    </BusinessContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBusiness() {
  return useContext(BusinessContext);
}
