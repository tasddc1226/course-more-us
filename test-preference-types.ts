// Simple test to verify preference learning types are properly defined
import type {
  UserBehaviorEvent,
  UserPreferenceProfile,
  PreferenceScore,
  PersonalizationWeights
} from './app/types/preference-learning'

import {
  PreferenceLearningError,
  InsufficientDataError,
  PreferenceLearningErrors
} from './app/lib/preference-learning/errors'

import {
  PERSONALIZATION_WEIGHTS,
  PREFERENCE_SCORE,
  EVENT_WEIGHTS
} from './app/lib/preference-learning/constants'

// Test type definitions
const testEvent: UserBehaviorEvent = {
  userId: 'test-user',
  eventType: 'click',
  targetType: 'place',
  targetId: 'place-123',
  metadata: {
    dwellTime: 5000,
    context: { page: 'recommendations' }
  }
}

const testProfile: UserPreferenceProfile = {
  userId: 'test-user',
  categoryPreferences: { 'restaurant': 0.8 },
  priceRangePreferences: { 3: 0.5 },
  regionPreferences: { 'seoul': 0.7 },
  tagPreferences: { 'romantic': 0.6 },
  searchPatterns: [
    { query: 'italian food', frequency: 5, lastUsed: new Date() }
  ],
  lastUpdated: new Date(),
  confidenceScore: 0.75,
  totalEvents: 42
}

const testWeights: PersonalizationWeights = {
  categoryBoost: 15,
  priceRangeBoost: 10,
  regionBoost: 8,
  tagBoost: 5
}

// Test error classes
const testError = new PreferenceLearningError(
  'Test error',
  'INSUFFICIENT_DATA',
  'test-user'
)

const insufficientDataError = PreferenceLearningErrors.insufficientData(
  'test-user',
  10,
  5
)

// Test constants
console.log('Max category boost:', PERSONALIZATION_WEIGHTS.MAX_CATEGORY_BOOST)
console.log('Preference score range:', PREFERENCE_SCORE.MIN, 'to', PREFERENCE_SCORE.MAX)
console.log('Click event weight:', EVENT_WEIGHTS.CLICK)

console.log('All preference learning types are properly defined!')