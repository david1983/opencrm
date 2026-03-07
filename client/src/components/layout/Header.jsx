import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../lib/store';
import { Button } from '../ui';
import api from '../../lib/api';

export default function Header() {
  const { user, logout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => api.search(searchQuery),
    enabled: searchQuery.length >= 2,
  });

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowResults(true);
  };

  const handleResultClick = (type, id) => {
    setShowResults(false);
    setSearchQuery('');
    navigate(`/${type}/${id}`);
  };

  const results = searchResults?.data || {};
  const hasResults =
    (results.accounts?.length || 0) > 0 ||
    (results.contacts?.length || 0) > 0 ||
    (results.leads?.length || 0) > 0 ||
    (results.opportunities?.length || 0) > 0 ||
    (results.tasks?.length || 0) > 0 ||
    (results.activities?.length || 0) > 0;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={searchRef}>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="search"
              placeholder="Search accounts, contacts, leads..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowResults(true)}
              className="w-80 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              </div>
            )}
          </div>

          {showResults && searchQuery.length >= 2 && (
            <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
              {hasResults ? (
                <div className="py-2">
                  {results.accounts?.length > 0 && (
                    <div>
                      <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase bg-gray-50">Accounts</p>
                      {results.accounts.map((account) => (
                        <button
                          key={account._id}
                          onClick={() => handleResultClick('accounts', account._id)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center"
                        >
                          <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{account.name}</p>
                            <p className="text-xs text-gray-500">{account.industry || 'No industry'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {results.contacts?.length > 0 && (
                    <div>
                      <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase bg-gray-50">Contacts</p>
                      {results.contacts.map((contact) => (
                        <button
                          key={contact._id}
                          onClick={() => handleResultClick('contacts', contact._id)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center"
                        >
                          <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{contact.firstName} {contact.lastName}</p>
                            <p className="text-xs text-gray-500">{contact.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {results.leads?.length > 0 && (
                    <div>
                      <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase bg-gray-50">Leads</p>
                      {results.leads.map((lead) => (
                        <button
                          key={lead._id}
                          onClick={() => handleResultClick('leads', lead._id)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center"
                        >
                          <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{lead.firstName} {lead.lastName}</p>
                            <p className="text-xs text-gray-500">{lead.company} • {lead.status}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {results.opportunities?.length > 0 && (
                    <div>
                      <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase bg-gray-50">Opportunities</p>
                      {results.opportunities.map((opp) => (
                        <button
                          key={opp._id}
                          onClick={() => handleResultClick('opportunities', opp._id)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center"
                        >
                          <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{opp.name}</p>
                            <p className="text-xs text-gray-500">{opp.account?.name || 'No Account'} • {opp.stage}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {results.tasks?.length > 0 && (
                    <div>
                      <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase bg-gray-50">Tasks</p>
                      {results.tasks.map((task) => (
                        <button
                          key={task._id}
                          onClick={() => handleResultClick('tasks', task._id)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center"
                        >
                          <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{task.subject}</p>
                            <p className="text-xs text-gray-500">{task.status}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {results.activities?.length > 0 && (
                    <div>
                      <p className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase bg-gray-50">Activities</p>
                      {results.activities.map((activity) => (
                        <button
                          key={activity._id}
                          onClick={() => handleResultClick('activities', activity._id)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center"
                        >
                          <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{activity.subject}</p>
                            <p className="text-xs text-gray-500">{activity.type}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-gray-500">
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}