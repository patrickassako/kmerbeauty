/**
 * WalkthroughOverlay
 * Full-screen overlay component with tooltip for onboarding walkthrough
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
    Modal,
} from 'react-native';
import { useWalkthrough, WalkthroughStep } from '../../contexts/WalkthroughContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WalkthroughOverlayProps {
    type: 'client' | 'provider';
    visible: boolean;
}

export const WalkthroughOverlay: React.FC<WalkthroughOverlayProps> = ({ type, visible }) => {
    const {
        clientCurrentStep,
        clientSteps,
        nextClientStep,
        skipClientWalkthrough,
        providerCurrentStep,
        providerSteps,
        nextProviderStep,
        skipProviderWalkthrough,
    } = useWalkthrough();

    const currentStep = type === 'client' ? clientCurrentStep : providerCurrentStep;
    const steps = type === 'client' ? clientSteps : providerSteps;
    const nextStep = type === 'client' ? nextClientStep : nextProviderStep;
    const skipWalkthrough = type === 'client' ? skipClientWalkthrough : skipProviderWalkthrough;

    if (!visible || currentStep < 0 || currentStep >= steps.length) {
        return null;
    }

    const step = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;
    const progress = ((currentStep + 1) / steps.length) * 100;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                {/* Semi-transparent background */}
                <View style={styles.backdrop} />

                {/* Tooltip Card */}
                <View style={styles.tooltipContainer}>
                    <View style={styles.tooltipCard}>
                        {/* Progress Bar */}
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${progress}%` }]} />
                            </View>
                            <Text style={styles.progressText}>
                                {currentStep + 1} / {steps.length}
                            </Text>
                        </View>

                        {/* Content */}
                        <Text style={styles.title}>{step.title}</Text>
                        <Text style={styles.description}>{step.description}</Text>

                        {/* Actions */}
                        <View style={styles.actions}>
                            <TouchableOpacity style={styles.skipButton} onPress={skipWalkthrough}>
                                <Text style={styles.skipButtonText}>Passer</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
                                <Text style={styles.nextButtonText}>
                                    {isLastStep ? 'Terminer' : 'Suivant'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Arrow pointer */}
                    <View style={styles.arrow} />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
    },
    tooltipContainer: {
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    tooltipCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        width: SCREEN_WIDTH - 48,
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        marginRight: 12,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#FF6B6B',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        color: '#999',
        fontWeight: '600',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#2D2D2D',
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
        textAlign: 'center',
        marginBottom: 24,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    skipButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        alignItems: 'center',
    },
    skipButtonText: {
        fontSize: 15,
        color: '#999',
        fontWeight: '600',
    },
    nextButton: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#FF6B6B',
        alignItems: 'center',
    },
    nextButtonText: {
        fontSize: 15,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    arrow: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 15,
        borderRightWidth: 15,
        borderTopWidth: 15,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#FFFFFF',
        marginTop: -2,
    },
});

export default WalkthroughOverlay;
