require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name = 'TransistorsoftCapacitorBackgroundGeolocation'
  s.version = package['version']
  s.summary = package['description']
  s.license = package['license']
  s.homepage = package['repository']['url']
  s.author = package['author']
  s.source = { :git => package['repository']['url'], :tag => s.version.to_s }
  s.source_files = 'ios/Plugin/**/*.{swift,h,m,c,cc,mm,cpp}'
  s.ios.deployment_target  = '12.0'
  s.dependency 'Capacitor'
  s.dependency 'CocoaLumberjack', '~> 3.7.2'
  s.libraries           = 'sqlite3', 'z'
  s.vendored_frameworks = ['ios/TSLocationManager.xcframework']
  s.static_framework = true
  s.swift_version = '5.1'
end
