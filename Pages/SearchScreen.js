// Pages/SearchScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Switch, TouchableOpacity, Dimensions, Image } from 'react-native';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

const { width } = Dimensions.get('window');

const SearchScreen = () => {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    ageRange: [18, 35],
    location: '',
    interests: [],
    onlineOnly: false,
    gender: 'any',
    distance: 50,
    verifiedOnly: false
  });

  const allInterests = ['Art', 'Music', 'Travel', 'Food', 'Sports', 'Books', 'Photography', 'Dancing', 'Wine', 'Nature', 'Movies', 'Fitness'];
  
  const toggleInterest = (interest) => {
    setFilters(prev => {
      if (prev.interests.includes(interest)) {
        return {...prev, interests: prev.interests.filter(i => i !== interest)};
      } else {
        return {...prev, interests: [...prev.interests, interest]};
      }
    });
  };

  const handleAgeChange = (value, index) => {
    const newRange = [...filters.ageRange];
    newRange[index] = value;
    setFilters({...filters, ageRange: newRange});
  };

  const resetFilters = () => {
    setFilters({
      ageRange: [18, 35],
      location: '',
      interests: [],
      onlineOnly: false,
      gender: 'any',
      distance: 50,
      verifiedOnly: false
    });
    setSearchText('');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Your Perfect Match</Text>
        <TouchableOpacity onPress={resetFilters}>
          <Text style={styles.resetButton}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={24} color="#888" />
        <TextInput
          style={styles.input}
          placeholder="Search by name, interests, or location..."
          placeholderTextColor="#888"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <ScrollView style={styles.filtersContainer} showsVerticalScrollIndicator={false}>
        {/* Gender Preference */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>I'm interested in</Text>
          <View style={styles.genderOptions}>
            <TouchableOpacity 
              style={[styles.genderButton, filters.gender === 'women' && styles.activeGender]}
              onPress={() => setFilters({...filters, gender: 'women'})}
            >
              <FontAwesome name="female" size={20} color={filters.gender === 'women' ? "#fff" : "#FF5A5F"} />
              <Text style={[styles.genderText, filters.gender === 'women' && styles.activeGenderText]}>Women</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.genderButton, filters.gender === 'men' && styles.activeGender]}
              onPress={() => setFilters({...filters, gender: 'men'})}
            >
              <FontAwesome name="male" size={20} color={filters.gender === 'men' ? "#fff" : "#4A90E2"} />
              <Text style={[styles.genderText, filters.gender === 'men' && styles.activeGenderText]}>Men</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.genderButton, filters.gender === 'any' && styles.activeGender]}
              onPress={() => setFilters({...filters, gender: 'any'})}
            >
              <Ionicons name="people" size={20} color={filters.gender === 'any' ? "#fff" : "#555"} />
              <Text style={[styles.genderText, filters.gender === 'any' && styles.activeGenderText]}>Any</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Age Range Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Age Range</Text>
          <View style={styles.ageRangeContainer}>
            <Text style={styles.ageText}>{filters.ageRange[0]}</Text>
            <View style={styles.sliderContainer}>
              <Slider
                style={{width: '100%', height: 40}}
                minimumValue={18}
                maximumValue={60}
                minimumTrackTintColor="#FF5A5F"
                maximumTrackTintColor="#ddd"
                thumbTintColor="#FF5A5F"
                value={filters.ageRange[1]}
                onValueChange={(value) => handleAgeChange(Math.round(value), 1)}
                step={1}
              />
            </View>
            <Text style={styles.ageText}>{filters.ageRange[1]}</Text>
          </View>
        </View>

        {/* Distance Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>
            Distance: Within {filters.distance} miles
          </Text>
          <View style={styles.sliderContainer}>
            <Slider
              style={{width: '100%', height: 40}}
              minimumValue={1}
              maximumValue={100}
              minimumTrackTintColor="#FF5A5F"
              maximumTrackTintColor="#ddd"
              thumbTintColor="#FF5A5F"
              value={filters.distance}
              onValueChange={(value) => setFilters({...filters, distance: Math.round(value)})}
              step={5}
            />
          </View>
        </View>

        {/* Location Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Location</Text>
          <View style={styles.locationContainer}>
            <MaterialIcons name="location-on" size={20} color="#FF5A5F" style={styles.locationIcon} />
            <TextInput
              style={styles.locationInput}
              placeholder="Enter city or country"
              placeholderTextColor="#888"
              value={filters.location}
              onChangeText={text => setFilters({...filters, location: text})}
            />
          </View>
        </View>

        {/* Interests Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Interests</Text>
          <Text style={styles.subtitle}>Select up to 5 interests</Text>
          <View style={styles.interestsContainer}>
            {allInterests.map(interest => (
              <TouchableOpacity 
                key={interest} 
                style={[
                  styles.interestTag,
                  filters.interests.includes(interest) && styles.selectedInterest
                ]}
                onPress={() => toggleInterest(interest)}
              >
                <Text style={[
                  styles.interestText,
                  filters.interests.includes(interest) && styles.selectedInterestText
                ]}>
                  {interest}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Advanced Filters */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Advanced Filters</Text>
          <View style={styles.advancedFilter}>
            <Text style={styles.filterLabel}>Online Now Only</Text>
            <Switch
              value={filters.onlineOnly}
              onValueChange={value => setFilters({...filters, onlineOnly: value})}
              trackColor={{ false: "#ddd", true: "#FF5A5F" }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.advancedFilter}>
            <Text style={styles.filterLabel}>Verified Profiles Only</Text>
            <Switch
              value={filters.verifiedOnly}
              onValueChange={value => setFilters({...filters, verifiedOnly: value})}
              trackColor={{ false: "#ddd", true: "#FF5A5F" }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.resetButtonContainer} onPress={resetFilters}>
            <Text style={styles.resetButtonText}>Reset All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton}>
            <Text style={styles.buttonText}>Apply Filters</Text>
            <MaterialIcons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  resetButton: {
    color: '#FF5A5F',
    fontSize: 16,
    fontWeight: '500',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    margin: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  filtersContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  filterSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 4,
  },
  activeGender: {
    backgroundColor: '#FF5A5F',
  },
  genderText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },
  activeGenderText: {
    color: '#fff',
  },
  ageRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  ageText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF5A5F',
    minWidth: 40,
    textAlign: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  locationIcon: {
    marginRight: 10,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  interestTag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 12,
  },
  selectedInterest: {
    backgroundColor: '#FF5A5F',
  },
  interestText: {
    color: '#555',
    fontWeight: '500',
  },
  selectedInterestText: {
    color: '#fff',
  },
  advancedFilter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterLabel: {
    fontSize: 16,
    color: '#555',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 24,
  },
  resetButtonContainer: {
    borderWidth: 1,
    borderColor: '#FF5A5F',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: '#FF5A5F',
    fontWeight: 'bold',
    fontSize: 16,
  },
  applyButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FF5A5F',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
});

export default SearchScreen;