// ...imports...
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ProfileSetupScreen({ navigation }) {
  const [birthdate, setBirthdate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  // removed `age` state

  const validateForm = () => {
    const newErrors = {};
    if (!name.trim())           newErrors.name = 'Name is required';
    if (!selfie)                newErrors.selfie = 'Selfie is required';
    if (!birthdate)             newErrors.birthdate = 'Birthdate is required';
    if (!gender)                newErrors.gender = 'Please select gender';
    if (!location.trim())       newErrors.location = 'Location is required';
    if (!lookingFor)            newErrors.lookingFor = 'Please select what you’re looking for';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) setBirthdate(date);
  };

  const handleNext = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload selfies & extras (omitted for brevity)

      const birthDateISO = birthdate.toISOString().split('T')[0]; // "YYYY-MM-DD"

      const payload = {
        id: user.id,
        full_name: name,
        bio,
        birthdate: birthDateISO,
        gender,
        location,
        occupation,
        education,
        interests: interests.split(',').map(i => i.trim()).join(','),
        looking_for: lookingFor,
        selfie_url,
        extra_images: uploadedExtraUrls.join(','),
      };

      const { error } = await supabase.from('profiles').insert([payload]);
      if (error) throw error;
      navigation.replace('MainTabs');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar + Sections */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Date of Birth:</Text>
          <TouchableOpacity
            style={[styles.dateInput, errors.birthdate && styles.errorInput]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.dateText, !birthdate && { color: '#999' }]}>
              {birthdate ? birthdate.toDateString() : 'Select your birthdate'}
            </Text>
          </TouchableOpacity>
          {errors.birthdate && <Text style={styles.errorText}>{errors.birthdate}</Text>}
        </View>

        {showDatePicker && (
          <DateTimePicker
            testID="dobPicker"
            value={birthdate || new Date(new Date().getFullYear() - 25, 0, 1)}
            mode="date"
            display="spinner"
            maximumDate={new Date()}
            onChange={onDateChange}
          />
        )}

        <TouchableOpacity onPress={handleNext} style={styles.button} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Complete Profile</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
