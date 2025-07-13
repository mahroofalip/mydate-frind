// NewMessageScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { getOrCreateConversation } from '../lib/chatHelpers';

export default function NewMessageScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, selfie_url')
        .neq('id', user.id);
      
      if (error) {
        console.error('Error fetching users:', error);
        return;
      }
      
      setUsers(data);
    };
    
    fetchData();
  }, []);

  const handleSelectUser = async (user) => {
    if (!currentUser) return;
    
    const conversation = await getOrCreateConversation(currentUser.id, user.id);
    
    if (conversation) {
      navigation.navigate('ChatScreen', {
        conversation: {
          id: conversation.id,
          name: user.full_name,
          image: user.selfie_url,
          userId: user.id
        }
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#888"
        />
        <MaterialIcons name="search" size={24} color="#888" />
      </View>
      
      <FlatList
        data={users.filter(user => 
          user.full_name.toLowerCase().includes(search.toLowerCase())
        )}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.userItem}
            onPress={() => handleSelectUser(item)}
          >
            <Image 
              source={{ uri: item.selfie_url }} 
              style={styles.avatar} 
            />
            <Text style={styles.userName}>{item.full_name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: '#333'
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15
  },
  userName: {
    fontSize: 16,
    color: '#333'
  }
});