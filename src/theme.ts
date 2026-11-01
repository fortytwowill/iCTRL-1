import { createTheme } from '@mantine/core';

export const theme = createTheme({
 primaryColor: 'blue',
 fontFamily: 'Inter, sans-serif',
 fontFamilyMonospace: 'Fira Code, monospace',
 headings: {
 fontWeight: '600',
 },
 components: {
 Button: {
 defaultProps: {
 radius: 'md',
 },
 },
 Card: {
 defaultProps: {
 radius: 'md',
 withBorder: true,
 },
 },
 TextInput: {
 defaultProps: {
 radius: 'md',
 },
 },
 Select: {
 defaultProps: {
 radius: 'md',
 },
 },
 },
});