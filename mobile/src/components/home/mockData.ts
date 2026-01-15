// Mock data for stories (to be replaced with real API data later)
export const MOCK_STORIES = [
    {
        id: '1',
        name: 'Éclat',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCv4-HM9p0WyHXufssiKjDBBQ58_HEY2hoR9ud5aHhFzmFR7EHdR-IwkgEajgtYmeN_YYptueFDaNes3EfZp_VofuzHHCNJPo3ntRRCb69uTSSQTRqakSFcveT7V1ln5vUcmlav6eWJOoXXyzsiPzDB-gC6wpe-G5YB93BkXze0wrM1dDModYEC_ErfD_QrY0HPBaSrFtwRwjPP-_hzcp3a2bPH-c7pkau2zQvmsJcvGAVZ8IdBAgFA0iDkvZ4u8qvLLGwuOqeVDBzO',
        viewed: false,
    },
    {
        id: '2',
        name: 'Divine',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxGkpgIQSnTrHXvs_GqODk_Anf6f6F7r7o6omdql9pY8B33eZtcHC10R0h153PlW38RPyP293Os7JGahtHK0hk94hT2orl49O-KSPSKYdAbbZ_e2vavV0nVDhI1SiibrXseqKpyt6HmOzebyCcvmRc5U4lEK0w7yRUPKuMGCfGA5QQPkrAy1HVDUSNrmXLkVTh0sjfBtq_r6yb_6-roVfOsGCrNu8HbCcm3iOjoDKLKiZGwIizWu0k3u8rTVS2eqMrTnVEllFYrmWc',
        viewed: false,
    },
    {
        id: '3',
        name: 'Sarah',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAedgq8NwTIHTW0A6qFlJxZOBWaS2saOnNv58JX6bfMUTRx4Gr-aSSjftNCI35RE-IV4ptmBcZn dqoUVbGiA_EeqLL_HfLObwpZId5cMp5hs9vxPXENjXcIE7G-Ne_QuvF256aq2DWSk3cAucygDXwJAaEktfEG9h5f4dGCxJzldZFMRA4ZUO_SpKAf92OxcwzsZJHAbfHc-JdOQFQLyXqDRXDt7prs03W3cUPTwciRLe8CewqRJ_4YBd0MdNEoBJ1zzzyfF6rAqOxP',
        viewed: true,
    },
    {
        id: '4',
        name: 'Rose',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCt1N3aj427P872H80eXymTAGtBzXykNGP6eCTpAtwQFYTojrATxHol0qEfRmuFxKcpHxQFSXYHsOVLHIwsMPD3EAd88O2q0PetD3WjioEuH_VqXaySJwR5AK_fut4mEeR67lQYJBsOIZf_goR9QNUg-FfPJ8rZh_AV6JxSCxGPhvzMJGzQwckbA-Tjzsj5Xd3N07ORml44Or7JEYu6uQzjfbVuf8npXBSa6MbBv1d4mvMw6NhS72msWBIuo1Jd8iUu_P5vm7vH32U_',
        viewed: false,
    },
    {
        id: '5',
        name: 'Belle',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmSG8LlGUhRleS_Uck90mvL1D6c5GJHQKputLMQPXdPZxxxQeeIG8t9nyOcvOml3P9sNV2pN9aJ4PL9sayBBvvdhecmtgJNqqYlrE3hpDhx0qEfgfti49tRsUuuefUiWJRRyrRy4DD_oWMKr1s9cGlJGTMh0GHIdxaAAfUdahnROemUCYNMgv5cwPP8tf5evVhvzI-mVBNJPUx_OK66-98R8y4u5OWXE8XhUiasbTd8B4RfN7cenlCamLJr4_JPTx6Ilt66UMBtFrx',
        viewed: false,
    },
];

// Mock data for promo banners
export const MOCK_PROMO_BANNERS = [
    {
        id: '1',
        badge: 'Offre Spéciale',
        title: 'Pack Mariage',
        subtitle: '-20%',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCt1N3aj427P872H80eXymTAGtBzXykNGP6eCTpAtwQFYTojrATxHol0qEfRmuFxKcpHxQFSXYHsOVLHIwsMPD3EAd88O2q0PetD3WjioEuH_VqXaySJwR5AK_fut4mEeR67lQYJBsOIZf_goR9QNUg-FfPJ8rZh_AV6JxSCxGPhvzMJGzQwckbA-Tjzsj5Xd3N07ORml44Or7JEYu6uQzjfbVuf8npXBSa6MbBv1d4mvMw6NhS72msWBIuo1Jd8iUu_P5vm7vH32U_',
        ctaText: 'Réserver Maintenant',
        onPress: () => console.log('Pack Mariage pressed'),
    },
    {
        id: '2',
        badge: 'Nouveauté',
        title: 'Soins Visage',
        subtitle: 'Premium',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmSG8LlGUhRleS_Uck90mvL1D6c5GJHQKputLMQPXdPZxxxQeeIG8t9nyOcvOml3P9sNV2pN9aJ4PL9sayBBvvdhecmtgJNqqYlrE3hpDhx0qEfgfti49tRsUuuefUiWJRRyrRy4DD_oWMKr1s9cGlJGTMh0GHIdxaAAfUdahnROemUCYNMgv5cwPP8tf5evVhvzI-mVBNJPUx_OK66-98R8y4u5OWXE8XhUiasbTd8B4RfN7cenlCamLJr4_JPTx6Ilt66UMBtFrx',
        ctaText: 'Découvrir',
        onPress: () => console.log('Soins Visage pressed'),
    },
];

// Service category to icon mapping
export const SERVICE_ICON_MAP: Record<string, keyof typeof import('@expo/vector-icons').Ionicons.glyphMap> = {
    HAIR_CARE: 'cut',
    MAKEUP: 'brush',
    WELLNESS_MASSAGE: 'hand-right-outline',
    NAIL_CARE: 'hand-left-outline',
    FACIAL_CARE: 'water',
    BODY_CARE: 'fitness',
    AESTHETIC: 'sparkles',
    OTHER: 'grid',
};
