import { useMutation, useQuery, type ApolloQueryResult } from '@apollo/client';
import { Menu, MenuItem } from '@mui/material';
import useTranslation from 'next-translate/useTranslation';
import { useState, type ReactElement } from 'react';
import {
    FindCookMealsDocument,
    UpdateCookMenuGreetingFromKitchenDocument,
    type FindCookMenuQuery,
} from '../../../../../../data-source/generated/graphql';
import PEMealCard from '../../../../../cards/mealCard/PEMealCard';
import PEButton from '../../../../../standard/buttons/PEButton';
import { Icon } from '../../../../../standard/icon/Icon';
import PEIcon from '../../../../../standard/icon/PEIcon';
import PEIconButton from '../../../../../standard/iconButton/PEIconButton';
import PETabItem from '../../../../../standard/tabItem/PETabItem';
import PETextField from '../../../../../standard/textFields/PETextField';
import HStack from '../../../../../utility/hStack/HStack';
import Spacer from '../../../../../utility/spacer/Spacer';
import VStack from '../../../../../utility/vStack/VStack';
import { type MealEntity, type MenuEntity } from '../../ChefProfilePageMenusTab';
import CreateCookMenuCourse, { type CreateCookMenuCourseDto } from '../../createMenu/createMenuStep2/CreateCookMenuCourse';
import UpdateCookMenuCourse from '../../createMenu/createMenuStep2/UpdateCookMenuCourse';

export interface ChefProfilePageEditMenusStep2Props {
    menu: MenuEntity;
    cookId: string;
    menuId?: string;
    onSelectedMeals?: (selectedMeals: MealEntity[]) => void;
    refetchMenus: (variables?: Partial<{ menuId: string; cookId: string }> | undefined) => Promise<ApolloQueryResult<FindCookMenuQuery>>;
}

export default function ChefProfilePageEditMenusStep2({ cookId, menu, refetchMenus }: ChefProfilePageEditMenusStep2Props): ReactElement {
    const { t } = useTranslation('chef-profile');

    const [selectedMeals] = useState<string[]>([]);
    const [greetingFromKitchen, setGreetingFromKitchen] = useState(menu.greetingFromKitchen ?? undefined);

    const [courses, setCourses] = useState<CreateCookMenuCourseDto[]>([]);

    const [showCreateCourseDialog, setShowCreateCourseDialog] = useState(false);
    const [showUpdateCourseDialog, setShowUpdateCourseDialog] = useState(false);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedMealId, setSelectedMealId] = useState<string | undefined>(undefined);
    const open = Boolean(anchorEl);

    const { data } = useQuery(FindCookMealsDocument, { variables: { cookId } });
    const meals = data?.cooks.meals.findMany ?? [];

    const [updateGreetingFromKitchen] = useMutation(UpdateCookMenuGreetingFromKitchenDocument, {
        variables: { cookId, menuId: menu.menuId },
    });

    function handleSaveUpdates(): void {
        if (menu.greetingFromKitchen !== greetingFromKitchen) {
            void updateGreetingFromKitchen()
                .then((result) => result.data?.cooks.menus.success && void refetchMenus())
                .catch((e) => console.error(e));
        }
    }

    return (
        <VStack className="w-full gap-6" style={{ alignItems: 'center', justifyContent: 'flex-start' }}>
            <VStack gap={32} className="w-full" style={{ alignItems: 'flex-start' }}>
                <VStack className="w-full">
                    <p className="w-full text-text-m-bold my-0">{t('create-menu-greeting-form-kitchen-label')}</p>

                    <div className="flex w-full my-4 gap-4 md:flex-col" style={{ alignItems: 'center' }}>
                        <HStack className="gap-4 w-full h-14" style={{ justifyContent: 'flex-start' }}>
                            <PETabItem
                                title={t('create-menu-yes')}
                                onClick={(): void => setGreetingFromKitchen('')}
                                active={greetingFromKitchen !== undefined}
                            />
                            <PETabItem
                                title={t('create-menu-no')}
                                onClick={(): void => setGreetingFromKitchen(undefined)}
                                active={greetingFromKitchen === undefined}
                            />
                        </HStack>
                        {greetingFromKitchen !== undefined && (
                            <PETextField type={'text'} value={greetingFromKitchen} onChange={setGreetingFromKitchen} />
                        )}
                    </div>
                </VStack>

                <VStack className="w-full gap-2" style={{ alignItems: 'flex-start' }}>
                    <span className="text-text-m-bold my-0">{t('create-menu-courses')}</span>
                    <Spacer />
                    {Boolean(!selectedMeals.length) && (
                        <PEButton className="max-w-[250px]" onClick={(): void => setShowCreateCourseDialog(true)} title={t('add-gear')} />
                    )}
                </VStack>

                {courses.map((course, index) => (
                    <VStack key={index} className="w-full" gap={16} style={{ alignItems: 'flex-start' }}>
                        <HStack gap={16} className="w-full" style={{ alignItems: 'center' }}>
                            <PETextField
                                value={course.title}
                                onChange={(changedTitle: string): void =>
                                    setCourses(
                                        courses.map(
                                            (c, index2): CreateCookMenuCourseDto =>
                                                index === index2 ? { title: changedTitle, meals: c.meals } : c,
                                        ),
                                    )
                                }
                                type="text"
                            />
                            <PEIconButton
                                icon={Icon.trash}
                                onClick={(): void => setCourses(courses.filter((_, index2): boolean => index !== index2))}
                            />
                        </HStack>

                        <HStack className="w-full py-4 box-border" gap={16} style={{ flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                            <VStack
                                onClick={(): void => setShowUpdateCourseDialog(true)}
                                className="items-center w-[400px] h-[140px] border-orange border-[1px] border-solid hover:cursor-pointer select-none hover:shadow-primary active:shadow-active delay-100 justify-center rounded-4"
                            >
                                <PEIcon icon={Icon.plusOrange} />
                                <span className="text-orange text-text-sm">Add Dish</span>
                            </VStack>

                            {course.meals.map((meal) => (
                                <div
                                    key={meal.mealId}
                                    className="flex w-[390px] relative"
                                    onClick={(event): void => {
                                        setAnchorEl(event.currentTarget);
                                        setSelectedMealId(meal.mealId);
                                    }}
                                >
                                    <PEMealCard title={meal.title} description={meal.description} />
                                </div>
                            ))}
                        </HStack>

                        {showUpdateCourseDialog && (
                            <UpdateCookMenuCourse
                                open={showUpdateCourseDialog}
                                meals={meals.filter((meal) => !course.meals.find((courseMeal) => courseMeal.mealId === meal.mealId))}
                                courseIndex={index}
                                onSuccess={(updatedCourse): void => {
                                    setCourses([...courses.slice(0, index), updatedCourse, ...courses.slice(index + 1)]);
                                    setShowUpdateCourseDialog(false);
                                }}
                                onCancel={(): void => {
                                    setShowUpdateCourseDialog(false);
                                }}
                                selectedCourseMeals={new Map(course.meals.map((item) => [item.mealId, item]))}
                            />
                        )}

                        {open && selectedMealId && (
                            <Menu
                                anchorEl={anchorEl}
                                open={open}
                                onClose={(): void => setAnchorEl(null)}
                                onClick={(): void => setAnchorEl(null)}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                sx={{ borderRadius: '12px', overflow: 'hidden' }}
                            >
                                <MenuItem
                                    sx={{ width: '200px' }}
                                    onClick={(): void => {
                                        setCourses([
                                            ...courses.slice(0, index),
                                            { title: course.title, meals: course.meals.filter((meal) => meal.mealId !== selectedMealId) },
                                            ...courses.slice(index + 1),
                                        ]);
                                    }}
                                >
                                    Delete
                                </MenuItem>
                            </Menu>
                        )}
                    </VStack>
                ))}

                <PEButton
                    type="secondary"
                    className="max-w-[250px]"
                    onClick={(): void => setShowCreateCourseDialog(true)}
                    title={t('create-menu-courses-add-course')}
                />

                {showCreateCourseDialog && (
                    <CreateCookMenuCourse
                        open={showCreateCourseDialog}
                        meals={meals}
                        onSuccess={(course): void => {
                            setCourses([...courses, course]);
                            setShowCreateCourseDialog(false);
                        }}
                        onCancel={(): void => setShowCreateCourseDialog(false)}
                    />
                )}

                <PEButton title="Save" onClick={handleSaveUpdates} disabled={menu.greetingFromKitchen === greetingFromKitchen} />
            </VStack>
        </VStack>
    );
}
