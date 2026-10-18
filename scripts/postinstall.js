import { execSync } from 'child_process';

console.log('----------------------------------------------------');
console.log(' Neon Sign Design Studio Desktop Packaging Environment Ready');
console.log('----------------------------------------------------');

if (process.platform === 'win32' || process.env.AUTO_BUILD_EXE === 'true') {
  console.log(' Windows system detected! Automatically compiling .exe files...');
  try {
    console.log(' Step 1/2: Building production web bundle (vite build)...');
    execSync('npm run build', { stdio: 'inherit' });

    console.log(' Step 2/2: Building Windows .exe installer and portable executable...');
    execSync('npx electron-builder --win', { stdio: 'inherit' });

    console.log('\n====================================================');
    console.log(' SUCCESS! .exe files have been created in the "release" folder:');
    console.log('    release/Neon Sign Design Studio Setup 1.0.0.exe (Installer)');
    console.log('    release/Neon Sign Design Studio 1.0.0.exe (Portable)');
    console.log('====================================================\n');
  } catch (err) {
    console.warn('\n Auto-build note: If offline, you can run: npm run build:exe\n');
  }
} else {
  console.log(' Ready to package for Windows anytime.');
}
