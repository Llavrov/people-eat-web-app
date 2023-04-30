import { useState, type ReactElement } from 'react';
import useResponsive from '../../../hooks/useResponsive';
import PEFooter from '../../footer/PEFooter';
import PEHeader from '../../header/PEHeader';
import PEHeaderMobile from '../../header/PEHeaderMobile';
import PETabItem from '../../standard/tabItem/PETabItem';
import HStack from '../../utility/hStack/HStack';
import VStack from '../../utility/vStack/VStack';
import ChefProfilePagePersonalTab from './personalTab/ChefProfilePagePersonalTab';

const MENU_TABS = ['Personal details', 'Bookings', 'Ratings', 'Dishes/Menus', 'Statistic', 'Chats', 'Show public profile'];

export default function ChefProfilePage(): ReactElement {
    const { isMobile } = useResponsive();

    const [selectedTab, setSelectedTab] = useState(0);

    return (
        <VStack className="w-full" gap={64}>
            {isMobile ? <PEHeaderMobile /> : <PEHeader />}

            <HStack
                gap={8}
                className="w-full max-w-screen-xl overflow-x-scroll"
                style={{ overflowY: 'initial', justifyContent: 'flex-start' }}
            >
                {MENU_TABS.map((menu, index) => (
                    <PETabItem
                        key={`${menu}_PEChefCard`}
                        title={menu}
                        onClick={(): void => setSelectedTab(index)}
                        active={selectedTab === index}
                    />
                ))}
            </HStack>

            {selectedTab === 0 && <ChefProfilePagePersonalTab />}

            <PEFooter />
        </VStack>
    );
}
