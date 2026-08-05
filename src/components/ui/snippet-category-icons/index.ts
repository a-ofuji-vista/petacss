import AccordionIcon from "./AccordionIcon.astro";
import BreadcrumbIcon from "./BreadcrumbIcon.astro";
import ButtonIcon from "./ButtonIcon.astro";
import CardIcon from "./CardIcon.astro";
import CarouselIcon from "./CarouselIcon.astro";
import CheckboxIcon from "./CheckboxIcon.astro";
import DecorationIcon from "./DecorationIcon.astro";
import DefaultIcon from "./DefaultIcon.astro";
import FaqIcon from "./FaqIcon.astro";
import FormIcon from "./FormIcon.astro";
import HeaderIcon from "./HeaderIcon.astro";
import HeadingIcon from "./HeadingIcon.astro";
import InputIcon from "./InputIcon.astro";
import LinkIcon from "./LinkIcon.astro";
import ModalIcon from "./ModalIcon.astro";
import PaginationIcon from "./PaginationIcon.astro";
import ProfileIcon from "./ProfileIcon.astro";
import RadioIcon from "./RadioIcon.astro";
import SelectIcon from "./SelectIcon.astro";
import TabIcon from "./TabIcon.astro";

export const categoryIconMap = {
  accordion: AccordionIcon,
  breadcrumb: BreadcrumbIcon,
  button: ButtonIcon,
  card: CardIcon,
  carousel: CarouselIcon,
  checkbox: CheckboxIcon,
  decoration: DecorationIcon,
  faq: FaqIcon,
  form: FormIcon,
  header: HeaderIcon,
  heading: HeadingIcon,
  input: InputIcon,
  link: LinkIcon,
  modal: ModalIcon,
  pagination: PaginationIcon,
  profile: ProfileIcon,
  radio: RadioIcon,
  select: SelectIcon,
  tab: TabIcon,
};

export type CategoryIconVariant = keyof typeof categoryIconMap;
type CategoryIconComponent = (typeof categoryIconMap)[CategoryIconVariant];

export { DefaultIcon };

export function getCategoryIcon(variant: string): CategoryIconComponent {
  return categoryIconMap[variant as CategoryIconVariant] ?? DefaultIcon;
}
