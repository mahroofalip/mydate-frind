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
npm install --global eas-cli && eas init --id 7eefe04b-0623-4d40-9554-f9ad45c28967
eas build -p android --profile development
eas build:configure
eas build -p android --profile production


