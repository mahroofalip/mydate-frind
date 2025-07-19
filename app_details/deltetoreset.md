# Delete .gradle
Remove-Item -Recurse -Force .\android\.gradle

# Delete app build
Remove-Item -Recurse -Force .\android\app\build

# Delete node_modules
Remove-Item -Recurse -Force .\node_modules

# Delete package-lock or yarn.lock
Remove-Item .\package-lock.json   # or .\yarn.lock

# Delete .expo folder
Remove-Item -Recurse -Force .\.expo

npm install
adb devices  
npx expo run:android
eas build -p android --profile development
eas build -p android --profile production

