import React, { createContext, useState, useContext } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);

  return (
    <UserContext.Provider value={{ user, setUser, profiles, setProfiles }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
