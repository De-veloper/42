import React from 'react';
import { Text, TextStyle } from 'react-native';

interface Props {
  style?: TextStyle;
  children: React.ReactNode;
}

export default function GradientText({ style, children }: Props) {
  return (
    <Text style={[{ color: '#00E5CC' }, style]}>{children}</Text>
  );
}
