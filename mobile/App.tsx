import React from 'react';
import { SafeAreaView, ScrollView, View, StatusBar } from 'react-native';
import styled from 'styled-components/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Design System
import { colors, spacing } from './src/design-system';

// Components
import { PrimaryButton, SecondaryButton } from './src/components/atoms/Button';
import { StyledText } from './src/components/atoms/Text';
import { TextInput } from './src/components/atoms/Input';

// Create a client
const queryClient = new QueryClient();

const Container = styled(SafeAreaView)`
  flex: 1;
  background-color: ${colors.background};
`;

const Content = styled(ScrollView)`
  flex: 1;
  padding: ${spacing['6']}px;
`;

const Header = styled(View)`
  margin-bottom: ${spacing['8']}px;
  align-items: center;
`;

const Section = styled(View)`
  margin-bottom: ${spacing['6']}px;
`;

export default function App() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Container>
          <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
          <Content>
            <Header>
              <StyledText variant="h1" align="center">
                KMERSERVICES
              </StyledText>
              <StyledText variant="body" color={colors.textSecondary} align="center">
                Services de Beauté à la Demande
              </StyledText>
            </Header>

            <Section>
              <StyledText variant="h3" style={{ marginBottom: spacing['4'] }}>
                Design System Demo
              </StyledText>

              <StyledText variant="h5" style={{ marginBottom: spacing['3'] }}>
                Typographie
              </StyledText>
              <StyledText variant="h1">Heading 1</StyledText>
              <StyledText variant="h2">Heading 2</StyledText>
              <StyledText variant="h3">Heading 3</StyledText>
              <StyledText variant="body">Body text regular</StyledText>
              <StyledText variant="caption" color={colors.textSecondary}>
                Caption text
              </StyledText>
            </Section>

            <Section>
              <StyledText variant="h5" style={{ marginBottom: spacing['3'] }}>
                Inputs
              </StyledText>
              <TextInput
                label="Email"
                placeholder="votre@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                label="Mot de passe"
                placeholder="Entrez votre mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </Section>

            <Section>
              <StyledText variant="h5" style={{ marginBottom: spacing['3'] }}>
                Boutons
              </StyledText>
              <PrimaryButton
                title="Bouton Principal"
                onPress={() => console.log('Primary button pressed')}
                fullWidth
                style={{ marginBottom: spacing['3'] }}
              />
              <SecondaryButton
                title="Bouton Secondaire"
                onPress={() => console.log('Secondary button pressed')}
                fullWidth
                style={{ marginBottom: spacing['3'] }}
              />
              <PrimaryButton
                title="Loading..."
                onPress={() => {}}
                loading
                fullWidth
                style={{ marginBottom: spacing['3'] }}
              />
              <PrimaryButton
                title="Disabled"
                onPress={() => {}}
                disabled
                fullWidth
              />
            </Section>

            <Section>
              <StyledText variant="h5" style={{ marginBottom: spacing['3'] }}>
                Prix (XAF)
              </StyledText>
              <StyledText variant="priceLarge" color={colors.coral}>
                25 000 XAF
              </StyledText>
              <StyledText variant="price" color={colors.coral}>
                5 000 XAF
              </StyledText>
              <StyledText variant="priceSmall" color={colors.coral}>
                1 500 XAF
              </StyledText>
            </Section>

            <Section style={{ marginBottom: spacing['12'] }}>
              <StyledText variant="caption" color={colors.textSecondary} align="center">
                KmerServices v1.0.0
              </StyledText>
              <StyledText variant="caption" color={colors.textSecondary} align="center">
                Cameroun 🇨🇲 | XAF
              </StyledText>
            </Section>
          </Content>
        </Container>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
