// src/components/common/LinearGradientView.tsx
import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface Props extends ViewProps {
  colors: [string, string] | readonly [string, string];
  angle?: 'vertical' | 'horizontal';
}

export const LinearGradientView: React.FC<Props> = ({
  colors,
  angle = 'vertical',
  style,
  children,
  ...props
}) => (
  <View style={style} {...props}>
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <LinearGradient
          id="grad"
          x1="0%"
          y1="0%"
          x2={angle === 'horizontal' ? '100%' : '0%'}
          y2={angle === 'vertical' ? '100%' : '0%'}
        >
          <Stop offset="0%" stopColor={colors[0]} />
          <Stop offset="100%" stopColor={colors[1]} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#grad)" />
    </Svg>
    {children}
  </View>
);
