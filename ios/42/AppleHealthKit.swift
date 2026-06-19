import Foundation
import HealthKit
import React

@objc(AppleHealthKit)
class AppleHealthKit: NSObject {

  private let store = HKHealthStore()

  private lazy var isoFormatter: ISO8601DateFormatter = {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return f
  }()

  private func parseISO(_ str: String) -> Date? {
    isoFormatter.date(from: str) ?? ISO8601DateFormatter().date(from: str)
  }

  @objc static func requiresMainQueueSetup() -> Bool { false }

  // MARK: - Init

  @objc func initHealthKit(_ permissions: NSDictionary, callback: @escaping RCTResponseSenderBlock) {
    guard HKHealthStore.isHealthDataAvailable() else {
      callback(["HealthKit not available"])
      return
    }

    var readTypes  = Set<HKObjectType>()
    var writeTypes = Set<HKSampleType>()

    if let perms = permissions["permissions"] as? [String: [String]] {
      for key in perms["read"] ?? [] {
        if let t = objectType(for: key) { readTypes.insert(t) }
      }
      for key in perms["write"] ?? [] {
        if let t = sampleType(for: key) { writeTypes.insert(t) }
      }
    }

    store.requestAuthorization(toShare: writeTypes, read: readTypes) { ok, err in
      if let err = err {
        callback([err.localizedDescription])
      } else {
        callback([NSNull()])
      }
    }
  }

  // MARK: - Save Workout

  @objc func saveWorkout(_ options: NSDictionary, callback: @escaping RCTResponseSenderBlock) {
    guard let typeStr  = options["type"] as? String,
          let startStr = options["startDate"] as? String,
          let endStr   = options["endDate"] as? String,
          let start    = parseISO(startStr),
          let end      = parseISO(endStr) else {
      callback(["Invalid workout options"])
      return
    }

    let activity = workoutActivityType(for: typeStr)
    var calories: HKQuantity?
    if let cal = options["energyBurned"] as? Double {
      let unit: HKUnit = (options["energyBurnedUnit"] as? String) == "calorie"
        ? .kilocalorie()
        : .kilocalorie()
      calories = HKQuantity(unit: unit, doubleValue: cal)
    }

    let workout = HKWorkout(activityType: activity,
                            start: start,
                            end: end,
                            duration: end.timeIntervalSince(start),
                            totalEnergyBurned: calories,
                            totalDistance: nil,
                            metadata: nil)

    store.save(workout) { ok, err in
      if let err = err {
        callback([err.localizedDescription])
      } else {
        callback([NSNull()])
      }
    }
  }

  // MARK: - Heart Rate Samples

  @objc func getHeartRateSamples(_ options: NSDictionary, callback: @escaping RCTResponseSenderBlock) {
    guard let startStr = options["startDate"] as? String,
          let endStr   = options["endDate"] as? String,
          let start    = parseISO(startStr),
          let end      = parseISO(endStr),
          let hrType   = HKQuantityType.quantityType(forIdentifier: .heartRate) else {
      callback([NSNull(), []])
      return
    }

    let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
    let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

    let query = HKSampleQuery(sampleType: hrType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, samples, err in
      if let err = err {
        callback([err.localizedDescription, NSNull()])
        return
      }
      let results = (samples as? [HKQuantitySample])?.map { sample -> [String: Any] in
        ["value": sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))]
      } ?? []
      callback([NSNull(), results])
    }
    store.execute(query)
  }

  // MARK: - Active Energy Burned

  @objc func getActiveEnergyBurned(_ options: NSDictionary, callback: @escaping RCTResponseSenderBlock) {
    guard let startStr = options["startDate"] as? String,
          let endStr   = options["endDate"] as? String,
          let start    = parseISO(startStr),
          let end      = parseISO(endStr),
          let energyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) else {
      callback([NSNull(), []])
      return
    }

    let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
    let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

    let query = HKSampleQuery(sampleType: energyType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, samples, err in
      if let err = err {
        callback([err.localizedDescription, NSNull()])
        return
      }
      let results = (samples as? [HKQuantitySample])?.map { sample -> [String: Any] in
        ["value": sample.quantity.doubleValue(for: .kilocalorie())]
      } ?? []
      callback([NSNull(), results])
    }
    store.execute(query)
  }

  // MARK: - Recent Workouts

  @objc func getRecentWorkouts(_ options: NSDictionary, callback: @escaping RCTResponseSenderBlock) {
    guard let startStr = options["startDate"] as? String,
          let start    = parseISO(startStr) else {
      callback([NSNull(), []])
      return
    }

    let end = Date()
    let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)
    let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

    let query = HKSampleQuery(sampleType: HKWorkoutType.workoutType(), predicate: predicate, limit: 50, sortDescriptors: [sort]) { _, samples, err in
      if let err = err {
        callback([err.localizedDescription, NSNull()])
        return
      }
      let results = (samples as? [HKWorkout])?.map { w -> [String: Any] in
        var dict: [String: Any] = [
          "uuid": w.uuid.uuidString,
          "activityType": self.activityName(for: w.workoutActivityType),
          "startDate": self.isoFormatter.string(from: w.startDate),
          "endDate": self.isoFormatter.string(from: w.endDate),
          "durationMinutes": Int(round(w.duration / 60)),
        ]
        if let cal = w.totalEnergyBurned {
          dict["calories"] = Int(round(cal.doubleValue(for: .kilocalorie())))
        }
        if let dist = w.totalDistance {
          dict["distanceMi"] = round(dist.doubleValue(for: .mile()) * 100) / 100
        }
        return dict
      } ?? []
      callback([NSNull(), results])
    }
    store.execute(query)
  }

  // MARK: - Step Count

  @objc func getDailySteps(_ options: NSDictionary, callback: @escaping RCTResponseSenderBlock) {
    guard let dateStr = options["date"] as? String,
          let stepsType = HKQuantityType.quantityType(forIdentifier: .stepCount) else {
      callback([NSNull(), 0])
      return
    }

    let calendar = Calendar.current
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"
    guard let date = formatter.date(from: dateStr) else {
      callback([NSNull(), 0])
      return
    }
    let start = calendar.startOfDay(for: date)
    let end = calendar.date(byAdding: .day, value: 1, to: start)!
    let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)

    let query = HKStatisticsQuery(quantityType: stepsType, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, stats, err in
      if let err = err {
        callback([err.localizedDescription, 0])
        return
      }
      let steps = Int(stats?.sumQuantity()?.doubleValue(for: .count()) ?? 0)
      callback([NSNull(), steps])
    }
    store.execute(query)
  }

  // MARK: - Type Helpers

  private func activityName(for type: HKWorkoutActivityType) -> String {
    switch type {
    case .running:                     return "Running"
    case .cycling:                     return "Cycling"
    case .walking:                     return "Walking"
    case .swimming:                    return "Swimming"
    case .traditionalStrengthTraining: return "TraditionalStrengthTraining"
    case .yoga:                        return "Yoga"
    default:                           return "MixedCardio"
    }
  }


  private func objectType(for key: String) -> HKObjectType? {
    switch key {
    case "HeartRate":           return HKQuantityType.quantityType(forIdentifier: .heartRate)
    case "ActiveEnergyBurned":  return HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)
    case "StepCount":           return HKQuantityType.quantityType(forIdentifier: .stepCount)
    case "Workout":             return HKWorkoutType.workoutType()
    default:                    return nil
    }
  }

  private func sampleType(for key: String) -> HKSampleType? {
    switch key {
    case "ActiveEnergyBurned":  return HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)
    case "Workout":             return HKWorkoutType.workoutType()
    default:                    return nil
    }
  }

  private func workoutActivityType(for name: String) -> HKWorkoutActivityType {
    switch name {
    case "Running":                     return .running
    case "Cycling":                     return .cycling
    case "Walking":                     return .walking
    case "Swimming":                    return .swimming
    case "TraditionalStrengthTraining": return .traditionalStrengthTraining
    case "Yoga":                        return .yoga
    default:                            return .mixedCardio
    }
  }
}
