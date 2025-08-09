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
npm install --global eas-cli && eas init --id 7b4be892-fd49-464e-8f49-b762936d98f5
eas build -p android --profile development
eas build:configure
eas build -p android --profile production


