/**
 * CopilotWalkthrough
 * Wrapper component providing interactive spotlight walkthrough using react-native-copilot
 */

import React from 'react';
import { CopilotProvider } from 'react-native-copilot';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface CopilotWalkthroughProps {
    children: React.ReactNode;
}

// Custom tooltip component with French text
const CustomTooltip = ({
    isFirstStep,
    isLastStep,
    handleNext,
    handlePrev,
    handleStop,
    currentStep,
}: any) => (
    <View style={styles.tooltipContainer}>
        <View style={styles.tooltipHeader}>
            <Text style={styles.stepNumber}>
                Étape {currentStep?.order || 1}
            </Text>
        </View>

        <Text style={styles.tooltipTitle}>{currentStep?.title || ''}</Text>
        <Text style={styles.tooltipDescription}>{currentStep?.text || ''}</Text>

        <View style={styles.tooltipActions}>
            <TouchableOpacity
                style={styles.skipButton}
                onPress={handleStop}
            >
                <Text style={styles.skipButtonText}>Passer</Text>
            </TouchableOpacity>

            <View style={styles.navButtons}>
                {!isFirstStep && (
                    <TouchableOpacity
                        style={styles.prevButton}
                        onPress={handlePrev}
                    >
                        <Text style={styles.prevButtonText}>← Précédent</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.nextButton}
                    onPress={isLastStep ? handleStop : handleNext}
                >
                    <Text style={styles.nextButtonText}>
                        {isLastStep ? 'Terminer ✓' : 'Suivant →'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    </View>
);

export const CopilotWalkthrough: React.FC<CopilotWalkthroughProps> = ({ children }) => {
    return (
        <CopilotProvider
            stepNumberComponent={() => null}
            tooltipComponent={CustomTooltip}
            overlay="svg"
            animated
            backdropColor="rgba(0, 0, 0, 0.75)"
            verticalOffset={0}
            labels={{
                skip: 'Passer',
                previous: 'Précédent',
                next: 'Suivant',
                finish: 'Terminer',
            }}
        >
            {children}
        </CopilotProvider>
    );
};

const styles = StyleSheet.create({
    tooltipContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        maxWidth: 320,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    tooltipHeader: {
        marginBottom: 12,
    },
    stepNumber: {
        fontSize: 12,
        color: '#FF6B6B',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    tooltipTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D2D2D',
        marginBottom: 8,
    },
    tooltipDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 20,
    },
    tooltipActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    skipButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    skipButtonText: {
        fontSize: 14,
        color: '#999',
    },
    navButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    prevButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    prevButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    nextButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#FF6B6B',
    },
    nextButtonText: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
    },
});

export default CopilotWalkthrough;
