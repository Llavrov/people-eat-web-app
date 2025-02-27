import { useMutation } from '@apollo/client';
import { CircularProgress, Dialog, DialogContent, DialogTitle, Divider } from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import moment, { type Moment } from 'moment';
import useTranslation from 'next-translate/useTranslation';
import Image from 'next/image';
import { useState, type ReactElement } from 'react';
import {
    CreateOneUserBookingRequestDocument,
    CreateOneUserByEmailAddressDocument,
    type CookRank,
    type CreateBookingRequestRequest,
    type CurrencyCode,
} from '../../../data-source/generated/graphql';
import searchAddress, { type GoogleMapsPlacesResult } from '../../../data-source/searchAddress';
import { type Allergy } from '../../../shared-domain/Allergy';
import { type Category } from '../../../shared-domain/Category';
import { type Kitchen } from '../../../shared-domain/Kitchen';
import { type Language } from '../../../shared-domain/Language';
import { type Location } from '../../../shared-domain/Location';
import { type SignedInUser } from '../../../shared-domain/SignedInUser';
import PEMealCard from '../../cards/mealCard/PEMealCard';
import PEFooter from '../../footer/PEFooter';
import PEHeader from '../../header/PEHeader';
import PEButton from '../../standard/buttons/PEButton';
import PECounter from '../../standard/counter/PECounter';
import PEDropdown from '../../standard/dropdown/PEDropdown';
import { Icon } from '../../standard/icon/Icon';
import PEIcon from '../../standard/icon/PEIcon';
import PEAutoCompleteTextField from '../../standard/textFields/PEAutoCompleteTextField';
import PEMultiLineTextField from '../../standard/textFields/PEMultiLineTextField';
import PETextField from '../../standard/textFields/PETextField';
import HStack from '../../utility/hStack/HStack';
import Spacer from '../../utility/spacer/Spacer';
import VStack from '../../utility/vStack/VStack';
import { calculateMenuPrice } from '../cookProfile/menusTab/createMenu/createMenuStep3/ChefProfilePageCreateMenuStep3';
import Payment from '../menuBookingRequest/Payment';

export interface PublicMenuPageProps {
    signedInUser?: SignedInUser;
    searchParameters: {
        location: {
            address: string;
            latitude: number;
            longitude: number;
        };
        adults: number;
        children: number;
        date: string;
    };
    allergies: Allergy[];
    publicMenu: {
        menuId: string;
        title: string;
        description: string;
        pricePerAdult: number;
        pricePerChild?: number;
        preparationTime: number;
        basePrice: number;
        basePriceCustomers: number;
        currencyCode: CurrencyCode;
        greetingFromKitchen: boolean;
        kitchen?: Kitchen;
        categories: Category[];
        imageUrls: string[];
        createdAt: Date;
        courses: {
            index: number;
            courseId: string;
            title: string;
            mealOptions: {
                index: number;
                meal: {
                    mealId: string;
                    title: string;
                    description: string;
                    imageUrl?: string | null;
                };
            }[];
        }[];
        cook: {
            cookId: string;
            rank: CookRank;
            city: string;
            biography: string;
            maximumParticipants?: number | null;
            maximumPrice?: number | null;
            maximumTravelDistance?: number | null;
            minimumParticipants?: number | null;
            minimumPrice?: number | null;
            travelExpenses: number;
            user: { firstName: string; profilePictureUrl?: string };
            location: Location;
            languages: Language[];
        };
    };
    stripePublishableKey: string;
}

// eslint-disable-next-line max-statements
export default function PublicMenuPage({
    signedInUser,
    publicMenu,
    searchParameters,
    allergies,
    stripePublishableKey,
}: PublicMenuPageProps): ReactElement {
    // const { isMobile } = useResponsive();

    const { t } = useTranslation('common');

    const [address, setAddress] = useState<string>(searchParameters.location.address);
    const [selectedLocation, setSelectedLocation] = useState<Location | undefined>(undefined);
    const [addressSearchResults, setAddressSearchResults] = useState<GoogleMapsPlacesResult[]>([]);

    const [adults, setAdults] = useState(searchParameters.adults);
    const [children, setChildren] = useState(searchParameters.children);
    const [dateTime, setDateTime] = useState(moment(searchParameters.date).set('hours', 12).set('minutes', 0));

    const [occasion, setOccasion] = useState('');
    const [message, setMessage] = useState<string>('');

    const [selectedAllergies, setSelectedAllergies] = useState<Allergy[]>([]);

    // for new users
    const [firstName, _setFirstName] = useState('');
    const [lastName, _setLastName] = useState('');
    const [email, _setEmail] = useState('');
    const [_phoneNumber, _setPhoneNumber] = useState('');

    const [stripeClientSecret, setStripeClientSecret] = useState<string | undefined>();

    const total = calculateMenuPrice(
        adults,
        children,
        publicMenu.basePrice,
        publicMenu.basePriceCustomers,
        publicMenu.pricePerAdult,
        publicMenu.pricePerChild,
    );

    const [completionState, setCompletionState] = useState<undefined | 'SUCCESSFUL' | 'FAILED'>(undefined);
    const [loading, setLoading] = useState(false);

    const [courseSelections, setCourseSelections] = useState<Map<string, string | undefined>>(
        new Map(publicMenu.courses.map((course) => [course.courseId, undefined])),
    );

    const disabled = Array.from(courseSelections.entries()).findIndex(([_courseId, mealId]) => mealId === undefined) !== -1;

    // const disabledForSignedInUser = !acceptedTermsAndConditions || !acceptedPrivacyPolicy;

    // const disabledForNewUser =
    //     firstName.length < 1 ||
    //     lastName.length < 1 ||
    //     !emailIsValid ||
    //     !phoneNumberIsValid ||
    //     !acceptedTermsAndConditions ||
    //     !acceptedPrivacyPolicy;

    // signedInUser ? disabledForSignedInUser : disabledForNewUser

    const [createMenuBookingRequest] = useMutation(CreateOneUserBookingRequestDocument);

    const [createUserWithMenuBookingRequest] = useMutation(CreateOneUserByEmailAddressDocument);

    function onBook(): void {
        const menuBookingRequest: CreateBookingRequestRequest = {
            adultParticipants: adults,
            children,
            dateTime: dateTime.toDate(),
            duration: 120,
            location: {
                latitude: selectedLocation?.latitude ?? 0,
                longitude: selectedLocation?.latitude ?? 0,
                text: address,
            },
            occasion,
            price: {
                // TODO actually not required here
                amount: total,
                currencyCode: 'EUR',
            },
            // allergyIds: selectedAllergies.map(({ allergyId }) => allergyId),
            message,
            cookId: publicMenu.cook.cookId,
            preparationTime: 120,
            configuredMenu: {
                menuId: publicMenu.menuId,
                courses: [],
                // Array.from(courseSelections.entries()).map(([courseId, mealId]) => ({ courseId, mealId })),
            },
        };

        setLoading(true);
        signedInUser
            ? void createMenuBookingRequest({
                  variables: {
                      userId: signedInUser?.userId ?? '',
                      request: menuBookingRequest,
                  },
              })
                  .then(({ data }) => {
                      if (data?.users.bookingRequests.createOne.success) {
                          setCompletionState('SUCCESSFUL');
                          setStripeClientSecret(data.users.bookingRequests.createOne.clientSecret);
                      } else setCompletionState('FAILED');
                  })
                  .catch(() => setCompletionState('FAILED'))
                  .finally(() => setLoading(false))
            : void createUserWithMenuBookingRequest({
                  variables: {
                      profilePicture: undefined,
                      request: {
                          firstName: firstName,
                          lastName: lastName,
                          emailAddress: email,
                          gender: 'NO_INFORMATION',
                          language: 'GERMAN',
                          password: '',
                          globalBookingRequest: menuBookingRequest,
                      },
                  },
              })
                  .then(({ data }) => setCompletionState(data?.users.success ? 'SUCCESSFUL' : 'FAILED'))
                  .catch(() => setCompletionState('FAILED'))
                  .finally(() => setLoading(false));
    }

    return (
        <VStack gap={64} className="w-full h-full">
            <PEHeader signedInUser={signedInUser} />

            <VStack className="relative lg:w-[calc(100%-32px)] w-[calc(100%-64px)] max-w-screen-xl mx-8 lg:mx-4" gap={16}>
                {publicMenu && (
                    <>
                        <HStack className="w-full bg-white shadow-primary box-border p-8 rounded-4" gap={16}>
                            {publicMenu.cook.user.profilePictureUrl && (
                                <Image
                                    style={{
                                        width: '120px',
                                        height: '120px',
                                        borderRadius: 4,
                                        objectPosition: 'center',
                                        objectFit: 'cover',
                                    }}
                                    src={publicMenu.cook.user.profilePictureUrl}
                                    alt={'Profile Picture'}
                                    width={120}
                                    height={120}
                                />
                            )}

                            {!publicMenu.cook.user.profilePictureUrl && (
                                <div className="bg-base rounded-2 flex justify-center items-center min-h-[120px] w-[120px]">
                                    <PEIcon edgeLength={32} icon={Icon.profileLight} />
                                </div>
                            )}

                            <VStack gap={16} style={{ alignItems: 'flex-start' }}>
                                <VStack gap={8} style={{ alignItems: 'flex-start' }}>
                                    <p className="text-heading-m my-0">{publicMenu.cook.user.firstName}</p>
                                    <span className="text-orange">{t(publicMenu.cook.rank)}</span>
                                </VStack>
                                <HStack gap={16}>
                                    <PEIcon icon={Icon.markerPin} />
                                    <span>{publicMenu.cook.city}</span>
                                </HStack>
                                {publicMenu.cook.languages?.length > 0 && (
                                    <HStack gap={16}>
                                        <PEIcon icon={Icon.messageChat} />
                                        <span>{publicMenu.cook.languages.map(({ title }) => title).join(', ')}</span>
                                    </HStack>
                                )}
                            </VStack>

                            <Spacer />
                        </HStack>

                        <HStack gap={32} className="w-full">
                            <VStack gap={32} style={{ flex: 1 }}>
                                {publicMenu.courses.map((course) => (
                                    <VStack key={course.courseId} className="w-full" gap={32}>
                                        <HStack className="w-full">
                                            <span className="text-heading-m">{course.title}</span>
                                            <Spacer />
                                        </HStack>

                                        <HStack gap={16} className="w-full" style={{ justifyContent: 'flex-start' }}>
                                            {course.mealOptions.map((mealOption) => (
                                                <PEMealCard
                                                    key={mealOption.index}
                                                    title={mealOption.meal.title}
                                                    description={mealOption.meal.description}
                                                    imageUrl={mealOption.meal.imageUrl ?? undefined}
                                                    active={courseSelections.get(course.courseId) === mealOption.meal.mealId}
                                                    onClick={(): void =>
                                                        setCourseSelections(
                                                            new Map(courseSelections.set(course.courseId, mealOption.meal.mealId)),
                                                        )
                                                    }
                                                />
                                            ))}
                                        </HStack>
                                    </VStack>
                                ))}
                            </VStack>

                            <VStack
                                gap={16}
                                style={{ width: 400, alignItems: 'flex-start' }}
                                className="w-full bg-white shadow-primary box-border p-8 rounded-4"
                            >
                                <h3 style={{ lineHeight: 0 }}>Event Details</h3>

                                <span>Personen</span>
                                <HStack gap={16} className="w-full">
                                    <PEIcon icon={Icon.users} /> <span>{'Erwachsene'}</span> <Spacer />
                                    <PECounter value={adults} onValueChange={setAdults} />
                                </HStack>

                                <HStack gap={16} className="w-full">
                                    <PEIcon icon={Icon.users} /> <span>{'Kinder'}</span> <Spacer />
                                    <PECounter value={children} onValueChange={setChildren} />
                                </HStack>

                                <span>Veranstaltungsdetails</span>
                                <HStack gap={16}>
                                    <div className="w-full min-w-[calc(50% - 8px)] h-16 border-[1px] border-solid border-disabled rounded-4 px-4 py-2 box-border">
                                        <DatePicker
                                            sx={{ width: '100%' }}
                                            value={dateTime}
                                            onChange={(changedDate: Moment | null): void => {
                                                if (changedDate) setDateTime(changedDate);
                                            }}
                                            slotProps={{ textField: { variant: 'standard', InputProps: { disableUnderline: true } } }}
                                            label={t('date-label')}
                                            minDate={moment().add(2, 'days')}
                                        />
                                    </div>
                                    <div className="w-full min-w-[calc(50% - 8px)] h-16 border-[1px] border-solid border-disabled rounded-4 px-4 py-2 box-border">
                                        <TimePicker
                                            sx={{ width: '100%' }}
                                            value={dateTime}
                                            onChange={(changedTime: Moment | null): void => {
                                                if (changedTime) setDateTime(changedTime);
                                            }}
                                            slotProps={{ textField: { variant: 'standard', InputProps: { disableUnderline: true } } }}
                                            label={t('start-time-label')}
                                        />
                                    </div>
                                </HStack>

                                <PEAutoCompleteTextField
                                    searchText={address}
                                    onSearchTextChange={(changedAddressSearchText: string): void => {
                                        setAddress(changedAddressSearchText);
                                        searchAddress(changedAddressSearchText, setAddressSearchResults);
                                    }}
                                    options={addressSearchResults}
                                    getOptionLabel={(selectedOption: GoogleMapsPlacesResult): string => selectedOption.formatted_address}
                                    onOptionSelect={(selectedSearchResult: GoogleMapsPlacesResult): void =>
                                        setSelectedLocation({
                                            latitude: selectedSearchResult.geometry.location.lat,
                                            longitude: selectedSearchResult.geometry.location.lng,
                                            text: address,
                                        })
                                    }
                                    placeholder={t('location-placeholder-label')}
                                />

                                <PEDropdown
                                    title={'Allergien'}
                                    options={allergies}
                                    getOptionLabel={(allergy): string => allergy.title}
                                    optionsEqual={(allergyA, allergyB): boolean => allergyA.allergyId === allergyB.allergyId}
                                    setSelectedOptions={setSelectedAllergies}
                                    showSelectedCount
                                    selectedOptions={selectedAllergies}
                                />

                                <PETextField value={occasion} onChange={setOccasion} type="text" placeholder="Anlass" />

                                <PEMultiLineTextField value={message} onChange={setMessage} placeholder={t('Nachricht')} />

                                <Divider flexItem />

                                <HStack className="w-full">
                                    <span>Preis pro Person</span>
                                    <Spacer />
                                    <span>{(total / 100 / (adults + children)).toFixed(2)} EUR</span>
                                </HStack>
                                <HStack className="w-full">
                                    <span>
                                        <b>Gesamtsumme</b>
                                    </span>
                                    <Spacer />
                                    <span>
                                        <b>{(total / 100).toFixed(2)} EUR</b>
                                    </span>
                                </HStack>

                                <PEButton disabled={disabled} title={'Jetzt Buchen'} onClick={onBook} />
                            </VStack>
                        </HStack>
                    </>
                )}
            </VStack>

            {completionState === 'SUCCESSFUL' && stripeClientSecret && (
                <Dialog open>
                    <DialogTitle>{'Zahlungsmittel hinterlegen'}</DialogTitle>
                    <DialogContent>
                        <Elements stripe={loadStripe(`${stripePublishableKey}`)} options={{ clientSecret: stripeClientSecret }}>
                            <Payment />
                        </Elements>
                    </DialogContent>
                </Dialog>
            )}

            {loading && (
                <Dialog open>
                    <DialogContent>
                        <CircularProgress />
                    </DialogContent>
                </Dialog>
            )}

            {completionState === 'FAILED' && (
                <Dialog open>
                    <DialogContent>{t('error')}</DialogContent>
                </Dialog>
            )}

            <PEFooter />
        </VStack>
    );
}
