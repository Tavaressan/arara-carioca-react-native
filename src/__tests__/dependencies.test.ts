describe('Dependency Resolution - Issues #21 & #19', () => {
  it('should not have duplicate expo-font versions (Issue #21)', () => {
    // This test verifies that expo-font is not duplicated in node_modules
    const fs = require('fs');
    const path = require('path');

    const nodeModulesPath = path.join(__dirname, '../../node_modules');

    // Check if expo-font exists at root level
    const expoFontRoot = path.join(nodeModulesPath, 'expo-font', 'package.json');
    const hasExpoFontRoot = fs.existsSync(expoFontRoot);

    // Check if expo-font exists inside expo's node_modules
    const expoFontInExpo = path.join(nodeModulesPath, 'expo', 'node_modules', 'expo-font', 'package.json');
    const hasExpoFontInExpo = fs.existsSync(expoFontInExpo);

    // Only one should exist after deduplication
    const totalExpoFontInstances = (hasExpoFontRoot ? 1 : 0) + (hasExpoFontInExpo ? 1 : 0);

    expect(totalExpoFontInstances).toBeLessThanOrEqual(1);

    // After proper fix, expo-font should only be in expo's internal node_modules
    // (managed by expo), not as a direct dependency
    if (hasExpoFontRoot) {
      const expoFontPkg = JSON.parse(fs.readFileSync(expoFontRoot, 'utf-8'));
      // If direct dependency exists, it should match expo's expected version
      expect(expoFontPkg.version).toMatch(/^14\./);
    }
  });

  it('should have react-native-worklets installed for react-native-reanimated (Issue #19)', () => {
    // Issue #19: react-native-worklets should be installed as peer dependency of react-native-reanimated
    const fs = require('fs');
    const path = require('path');

    const nodeModulesPath = path.join(__dirname, '../../node_modules');
    const rnWorkletsPath = path.join(nodeModulesPath, 'react-native-worklets', 'package.json');

    const hasRNWorklets = fs.existsSync(rnWorkletsPath);
    expect(hasRNWorklets).toBe(true);
  });
});
