import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Lara from '@primeuix/themes/lara';
import App from './App.vue';
import router from './router';

// PrimeVue components
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import Menubar from 'primevue/menubar';
import Avatar from 'primevue/avatar';
import Menu from 'primevue/menu';
import Dialog from 'primevue/dialog';
import Toast from 'primevue/toast';
import ToastService from 'primevue/toastservice';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import Tooltip from 'primevue/tooltip';
import ToggleSwitch from 'primevue/toggleswitch';
import ConfirmDialog from 'primevue/confirmdialog';
import ConfirmationService from 'primevue/confirmationservice';
import Tag from 'primevue/tag';


// PrimeVue styles
import 'primeicons/primeicons.css';

// Custom styles
import '@/assets/theme.css';
import '@/assets/main.css';


import 'primeflex/primeflex.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: Lara,
        options: {
            darkModeSelector: '.my-app-dark'
        }
    }
});
app.use(ToastService);
app.use(ConfirmationService);

// Register PrimeVue components globally
app.component('Button', Button);
app.component('InputText', InputText);
app.component('Password', Password);
app.component('Card', Card);
app.component('DataTable', DataTable);
app.component('Column', Column);
app.component('Dropdown', Dropdown);
app.component('Calendar', Calendar);
app.component('InputNumber', InputNumber);
app.component('Textarea', Textarea);
app.component('Menubar', Menubar);
app.component('Avatar', Avatar);
app.component('Menu', Menu);
app.component('Dialog', Dialog);
app.component('Toast', Toast);
app.component('Select', Select);
app.component('DatePicker', DatePicker);
app.directive('tooltip', Tooltip);
app.component('ToggleSwitch', ToggleSwitch);
app.component('ConfirmDialog', ConfirmDialog);
app.component('Tag', Tag);

app.mount('#app');
