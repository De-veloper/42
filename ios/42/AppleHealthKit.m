#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AppleHealthKit, NSObject)

RCT_EXTERN_METHOD(initHealthKit:(NSDictionary *)permissions callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(saveWorkout:(NSDictionary *)options callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getHeartRateSamples:(NSDictionary *)options callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getActiveEnergyBurned:(NSDictionary *)options callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getRecentWorkouts:(NSDictionary *)options callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(getDailySteps:(NSDictionary *)options callback:(RCTResponseSenderBlock)callback)

@end
