import { Alert, Linking } from 'react-native';

import type { Person } from './types';

const digits = (s: string) => s.replace(/[^\d+]/g, '');

async function open(url: string, fallback: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Could not open', fallback);
  }
}

export function messagePerson(p: Person) {
  if (!p.phone) {
    Alert.alert('No phone number', `Add a phone number for ${p.name} to message them from Tend.`);
    return;
  }
  open(`sms:${digits(p.phone)}`, 'Messages is not available on this device.');
}

export function callPerson(p: Person) {
  if (!p.phone) {
    Alert.alert('No phone number', `Add a phone number for ${p.name} to call them from Tend.`);
    return;
  }
  open(`tel:${digits(p.phone)}`, 'Calling is not available on this device.');
}
