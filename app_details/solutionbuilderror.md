Remove-Item -Recurse -Force node_modules, "android\build", "android\app\build"
npm install
npx expo prebuild --clean
eas build --platform android --profile production