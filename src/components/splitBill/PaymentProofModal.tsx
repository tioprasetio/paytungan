import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { SOCKET_URL } from '../../config/api.config';
import { PaymentProof, UserBillDetail } from '../../types';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useAlert } from '../../context/AlertContext';
import {
  X,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  FileText,
  Sparkles,
  Camera,
  Image as ImageIcon,
  RotateCw,
} from 'lucide-react-native';

// Sample modern transfer receipt base64 placeholder for simulation/testing
const SAMPLE_RECEIPT_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlgAAAGQCAYAAAByNR6YAAAABHNCSVQICAgIfAhkiAAAAGJ' +
  'RUWHRUaXRsZQBNb2JpbGUgQmFua2luZyBUcmFuc2ZlciBSZWNlaXB0AAAAADtQvG4AAAAldEVYdENyZWF0aW9uIFRpbWUAMjAyNi0w' +
  'OC0zMVQxNzo1ODoxNiswNzowMMEaD08AAAAfdEVYdFNvZnR3YXJlAEFkb2JlIEZpcmV3b3JrcyBDU1Y51VFXAAAAGXRFWHRBdXRob3' +
  'IAVGl0aXBEb25nIEFwcHM67jNCAAAcM0lEQVR4nO3df5RcZZ3o8e/zVM3MhCSdTiYhCSQkIUyEQCAhCQQIkhgIsq6igsuirrt793q9' +
  '9+p6/bW9+13ddV13d71e9/WubtcV3XUlurq6LoqIrLKu64qygoCgkgCGRBLCQBLIJGQm0+l0pnt+f1RNd6ZTuquqTidVffqc43lyur' +
  'r6VPXzvfW+zz3P+/z+93+fnZ2dx9bW1l7X29v7f9ra2h4OIZzS2tp6Qk9Pz/Genp4jPT09Jw4NDX03iqKzW1tbX3rWWWe9Z3V19T2r' +
  'q6tvOnr06DuOHj36jiiK1gAEgRDCyX19fdcODg7+eW9v7x8NDQ392dDQ0B81Nzff097e/t5sNlsIITA2Nvaq5ubm7/T39//+2traX8' +
  '1ms1/OZrNf+83f/M3fnXbaadccO3bsW81mszWKosHR0dEXn/iXf/mX5/zmb/7mF1ZXV2/NZrMf9PX1/eXg4ODf9ff3/2VbW9vN' +
  'LS0tr29vb39rCGFzCOGVLS0t373gggu+2dTU1Nbc3HxyT0/Pa8fHx//P9vb2k48dO/b/Pvvss38/MzPzb2tra3/b19f390dGRn5/aGj' +
  'or48ePfo/5+fn/2N2dvZ7c3Nz//X48eP/89SpU/9tdnb2uzMzM9964okn/tPx48d/OD4+/t9mZma+89xzz31ldXX132tra787MzPznd' +
  'nZ2W/Pzc19c35+/p+OHz/+d7Ozs/80MzPz3fn5+f88Pz//5YceeujfZmdn//Ho0aP/8cMf/vD3Dx8+/Hfz8/P/eOzYsf+em5v7m/n5' +
  '+S/Pzs7+zbFjx364urr6t08//fRfZGdnvzk3N/ffZ2dnf31mZubvz83NfXl+fv5Lzz///Jfn5+e/9eijj77o6NGjf3/s2LH/Njc395+' +
  'ffvrpv19dXf33mZmZv5idnf3T2dnZz8/Ozn51enr6b1ZXV/9qdnZ2bm5u7q/m5+f/dnZ29i8PHTr0b7Ozs3/W1tb27qGhoT8444wz' +
  'fuPEiRM/f+KJJ7554sSJv/jhD3/4lbm5ua8ePnz4C2tra185duzY/zwzM/PnR48e/ZOpqalvHDly5A9mZ2e/ODMz88Wpqan/eOTIkd' +
  '9ZW1v77PHjx//f/Pz8/5iZmfnKk08++Y+zs7NfO3To0JdmZ2e/PTk5+Xvz8/P/bnp6+stzc3N/Nz09/aXZ2dnPP/jgg38/MzPzhRdee' +
  'OHfzs3NfWFqaupvjh49+uennnrq72ZnZ//s2LFjfzQ3N/fFtbW1z09OTn5+cnLy0pGRkRf39fVd0N7efnRbW9tpIyMjr+rt7f3r3t7e' +
  '3x0bG3vN6OjoiwcHB187NDT0e81ms39wcPDVQ0NDrxgeHn7dyMjIa48ePfqG1tbWC4aHh189MjLy6sHBwVcNjYyMvP6CCy54zcjIyKt' +
  'GR0df09raenbLKaecoqurK4pSKe2pVDqdSmVTyWSmlE6lW1tbT+ns7HxFZ2fnxZ2dna/s7Ox8VXt7+6sGBgZet2fPnt+58MILX9PW1vb' +
  'qtra2lw8NDb2qt7f3T48fP/5f3nvvvb+fnp7+5wceeOBvjhw58l+mp6e/fO7cub9dWVn5q7m5uc+tra19dmZm5vMHDx7812efffb2ycn' +
  'J2ycnJ2+bnZ39/MrKypeeeeaZ/zkzM/P/PvTQQ/95enr6P46Njf2bdevWfX5kZOSDra2tlw4PD79uZGTEHBoaetXo6Oh/bG9v/38DAw' +
  'N/0tvb+4ft7e1/3tbW9pampqZ/0traemZzc/M/bmtru6qjo+M17e3tr25paXnZunXrXnfqqad+c2Rk5DWtra0XtLS0vKKjo+Pijo6OF' +
  '3V0dLyora3tFW1tbS9ramo6p7W19XkdHR2/0dXV9eqWlpZ/0NbWdnFbW9vr2tvbX7Zu3bp/ODQ09Kru7u4Lunr6enq63d3dbv7+/r7v' +
  '7+/r7vv+1atXD13r1q1b19raemZLS8t/HRsb+6Pu7u4L+/r6zuro6HB1dHT0rFu3rvvqq6/+nampqe9u2LDhtV1dXRd2dXW1dnV1Xdr' +
  'V1XXR+vXrL+rs7Lygo6Pj1Z2dnS8bHR39k6effvq2kydP3vrYY4/9xczMzFfm5ua+tby8/J8mJye/tLKycsuGDRtuv/vuu28ZGxv758e' +
  'PH3/m8OHD/+30009/dUtLywXNzc0XdXV1XdDd3d21bt26rvXr13ddccUVXevWrRvYsGFD15VXXrm/q6vr8o6OjhcfOXJk6fjx4yvPPfd' +
  'ctry8nJubm0vdcccdqWeeeSY1NTWVOnDggDtw4EBqenraaWlpKV566aXF73znO7n/+Z//yT/44IPps88+O33qqadmPvjgg6mdO3emTzz' +
  'xROpHP/pRat++famTJ086+/fvT23ZssVZu3Zt8dRTT3VfeumlxbVr1xZ7e3uL/f39xaGhoWJ/f3+xr6+v6Lq6uuL169e71q9f71q7dm' +
  '2xs7Oz2N7eXmxra3O7du1K13Vduru7u51S6ZpSqX/Z1tb2hpaWlgtaW1v/saWl5bWtra2vHRkZec0FF1zw2mPHjv3m22+/fePMzMyXDz' +
  '300B2PPPLIbTt37vzqjh07/mN6evq/z87Ofufw4cN3rK2t3TUxMfGvly1b9t97e3tf0dnZecG6desu6uzsvKCtrW1oaGjoNa2trS/r7O' +
  'y8pLW19aWdnZ0XdnZ2vnzfvn0Xn3baaS8bHx+/4OjRo2eMjo6+7vjjj7/4yJEjC3NzcxOTk5P5ycnJ4gsvvFBMTEyUxsfHS8ePHz98e' +
  'Hh46dixY8vT09OnfvCDH5y6++67s3feeWdqenqaBgcHnSOPPNI5/vjjs9XV1Xz37t3p7u7u1ODgYGr9+vVOT09Pcf369c7g4GCxu7s7' +
  '39LS4tbW1jqdnZ35jo6OYmdnZ7Gtrc3p7OwstLS02Ojo6E5nZ2f+mGOO4f/15ptvdvr6+pz169c7a9eudanb39/vOjo63I6ODre5udk' +
  'pFIpFp1AoOB0dHU73mjVr/qqnp+fl/f39r+rq6jq/vb39vOHh4dcMDAy89vTTT3/1nj17/nZubu7zDxw48I2pqalvzczMfH5sbOybIy' +
  'Mjr7vgggtePTg4+Iqurq4L+/v7X9bd3X1hT0/PRV1dXZcePXr01R0dHS/q6Oh4bVtb2yuGh4dfe+DAgVe1t7df0t/ff05XV9e/GxsbO' +
  '2NkZORlR44cOfPo0aNz+/btKy8tLRXvvffe0r59+0qf+tSnnIsuuogbN250zjnnHOfoo4/OHn300enR0dHk2rVri729vcV169Y5PT09' +
  'xcHBwWJLS4tTX1/vNDY2Og0NDU5tbW2hoqLCKS8vdwoFBw8fPmwHDhwopFKp9KlTp1ILCwupnTt3OhMTE2nt2rWpV1991Tl58qSzbt26' +
  'fFdXV/qEE07IOZ2dnU59fb1TWVnprFu3LlVfX+/09PTk+/v7Cz09PUVHR4cTCAQcgUDA8fv9gUAg4Pj9fkcwGAwFAoFgaWlp6oQTTnA6' +
  'OjpyLS0tTnt7uxMIBBxdXV1ua2trYfv27anx8XFn165dTldXlzMyMpK69NJL81/84hfTPT09qZNOOsnZvn27Mzk56UxMTKRWrFjhbNmy' +
  'xbnggguc9vb2fDqdTjU0NDiHDx9OvfLKK6ndu3enZmdnnTvvvDM1MTGRWr16dWrLli3O8ePH82vWrHE6OzudhoYGJ5PJOGvXrnUaGhoc' +
  'X//6110f/vCHncrKSqegoMDx+/2O3+93gsGg4/P5AoFAwAkEAs7f/M3fnHPaaaelNm7cmNq6dauztraWmpycdM6ePevce++9qYceeii1' +
  'b9++9MmTJ53LLrus2NHRkR8aGsqvW7fO6e3tzfd1dXVdf/TRR1+0atWq86urq8/p7Ox8eWdn58uGhob+fGRk5DXHjh37vccff/ybU1NT' +
  'X5+Zmfmru+6668sjIyOv3rBhwyU9PT0Xd3V1XdDe3n7RsWPHXjc0NPSa3t7el/b29p6/fv36cxsaGs5rbW19TWdn5ys7Oztf2d3d/bI' +
  'DBw689thjj73s6NGjZ0xMTORmZ2eLe/bsKe/fv790xx13pE8++WTn0ksvdfbu3ets3rzZOe2007Jvf/vbcxUVFflisZhfvnx5+vTp06' +
  'lt27Y5u3btcnbs2OFs27bNqa+vd6qrq52amhpnbW2tU15e7pSVlTllZWVOsVicn52dTc3Pz6c2bNiQamxsTHd0dKSampoK1dXVhaqqqk' +
  'J5eblTXV3tVFdXO6FQKBAKhQJlZWWFioqKwvDwcOqSSy5JHXPMMc7FF1/s7Nu3zzl06FBq3759zvj4eGpmZib/ne98J/fII4+kDhw4kL' +
  'rvvvuczZs3p7dv35666aab8t3d3ampqal8IpFI33vvvflTp06lPvOZzzhvfetbnfe///3ON77xDecb3/hGenJyMn8gEAj4/f7g6Ojoq+' +
  '+4446/rqmpqb/xxht/d9OmTS9samq6squr67zW1tYz+/r6XjM2Nvaao0ePvmF2dvav/vRP//Tf5+bmvnrPPffcOTc397VvfOMbv75q1aq' +
  'zuru7L2hrazu/vb39/JaWltccO3bsf87MzHxtamrqj8fGxv7r4ODgy3p7e88dGRl5ZXNz88t6enr+sq+v77+0tbW9qqur65K2trbzmpub' +
  'z2tubn5la2vrxS0tLRdsbW09eXJyMjc7O1scHx8vff7zn3f27dunFi5cmPvEJz6R+trXvpYKhUKB8vLyQn19faGmpqZQUVFRqKqqKlRW' +
  'VhZqa2sLVVVVhaqqqkJVVVWhtbW10NLSkh4dHU29+uqr+ampqdTY2Fjq8OHDzp49e1Ktra3pjRs3pgYHB52hoSHntNNOcxoaGpzV1dVO' +
  'Y2NjvqysrFBeXl6oqqoqrFmzpjA0NJTaunWrk81m8wsLC8WXXnqp+NxzzxVeeOGF1Pbt251Vq1aljhsfH09dfPHFqc9+9rOpPXv2pC64' +
  '4IJcR0dHqqWlJZ9MJtOtra2F3/u935u/8MILc+vXr89PTEx8b/Pmzb/f0dFx7vj4+AcGBwc/3tfX95re3t6/HBgYePWxY8d+99ixY3/x' +
  'xBNPfPPcuXN/Mz8//2937dr1v3bv3v33Y2NjHzh27NhHent7X9HX1/eKvr6+V3V0dFx06tSp8ycmJkpPPfVU6b777ks/8sgj6enp6fzJ' +
  'kyfzk5OTzq233pqvqqpKVVVVpRoaGgqdnZ2FoaGhwvr16wv79u0rbN26tXDfffflh4aG0o2NjemRkZF0f39/unfduv+vpaWlMDw8nFpd' +
  'XU3t27cv9bOf/Sw1OTnpTE1N5e+7777U7Oxsav/+/alpWVkpLl++PLdt2zbnxhtvdBoaGpz29vbc2rVr862trflAIOAEAgHH5/M59fX1' +
  'aXd3dxGv1+sCgQA7Ozsdr9frAoGA4/V6He/atWvd5s2bc+vXr89v3brVOXnypLNr1y5n7969qampKWfdunUp9Xq9xZ6enpzX6w1u2LDB' +
  'HRoaKnq9Xufqq6/O9/T05Orq6pxAIDD4f3//92/+/Oc//091dXUvGRkZeX17e/uHOjs7z29vbx8aHx9/zfbt218zNDT0itbW1vN7enou' +
  'GBkZeW13d/eFLS0t/7ChoeH/6enp+fP+/v6/Gh4eft34+Pj/u++++/7T7t27v/7II4/80dzc3Denp6e/eeDAgfvGxsb+x0c/+tG/Xbdu' +
  '3aUjIyOv2bBhwwWHDx9Wjhw5Ujpy5Ehpx44dzubNm9Pbtm1zJiYm8iMjI6m2trakx+NxeTweZ2VlxeH1eh2v1+sEAoHA8uXLnfXWv/3b' +
  'vz2/fft29eCDD+bvuuuu9MzMTGpubi517NixlEqlUslkMvXlL3859dGPfjQ1Ojqabmtryy9fvrxwzDHHFO+9997c4sWL/4+2tra/aGxs' +
  '/L/Xr1//+5deeunfrV+/vrOhoSF/xBFHuG9/+9upAwcOOE888UT+pZdeKs7NzRVvvfXW1EsvvZSysLCQmZycTF111VWpFStWOPX19Y6v' +
  'rKzMqaqqcrxer+v3+/1bt251hoeHc6tXr85/4QtfSF122WWpY445pmhubnbq6uqcdevWucvKykoej8cZHBxMdnZ2OpWVlaXjTj311Mtt' +
  'ra2tr3V1df1bZ2fnq9ra2l7a2dn5iqamplcMDAy8fnh4+DWtra3/r7W19cKurq6LOjs7z29tbT2ro6Pj/JaWlpft27fvv1977bX/MDc3' +
  'd9v9999/x+zsrLNv3770TTfdlP/gBz+YmpqaSiUSidTEj3/849T69etT3d3dhVgsVhgbGys0NTUVhoeHCxUVFYWFCxcWqqqqCvX19YXG' +
  'xsZCZWVlobq6uhAKhVKe1tbWcldXV354eDi1Z8+e/NTUVGpqaiq1b9++1L59+1Jzc3OpVCrlPPnkk6lNmzblKyoqUm6329XR0ZFramrK' +
  'tbS0FOrq6lytra1/9v/+/u/fvOuuu27fsmXL715yySW/097e/vLly5cXL7300uLQ0FCqra3NWblyZb6jo8Pp6+tzenp6ip2dnUXHsq1b' +
  't3adffbZr15fWVn5r52dnRft27fv1du3b79g//79v7d9+/a/fPXVV2/fsWPHbSdOnPj2/Pz8bSdPnrztt7/97bft2rXr1pMnT972xz/+' +
  '8S937tz572fPnv1WdnZ2bnZ29t/m5ubm5ubm/md2dvb/m5ub+7/z8/Pfmp+f/84LL7zw9ampqW8ePXr020eOHPn29PT07e+9995t77zz' +
  'zu3vvffebT/5yU9+84UXXvj29PT0t/ft23fH2NjY//bEE098+9ixY98+ceLEt1544YW/f/zxx7957Fix7584ceLbR48e/e/Hjh37/vPP' +
  'P//b2dnZ/zw7O/uNM2fO3DE3Nzf3zDPPfOvw4cN/v3///ttOnjz57UOHDt157NixO1544YXbTp069d25ubm/PXr06B0PPfTQbceOHbvj' +
  '9OnT/z49Pf2NkydP3vb8889/+6GHHrrz2LFjt7/yyit37Ny5864dO3b827Fjx+546KGHPjMzM/P1RxxxRDEcDjuFQiFfXl7uFAqFQkVF' +
  'hfOxj33sqmuuuWZkaGjoNW1tbS/v7Oy8oL29/cKenp4Lu7u7L2hoaCg0NTUVKioqCsXFxYVAIOAEg0FnzZo1/7Z69eq/W7169d+tXr36' +
  'N1paWl7f1dX1iu7u7osXL17sVFRUOMFg0FmyZIlz7rnnOg899FDq8ccfTz399NOpqamp/KFDh1IPPvjgfPfu3bnNmzenNm/enB4aGkoP' +
  'Dw+nlixZku7p6cnV1dUVHA6H43K5HIfD4fD7/c6qVauKNTU1zqJFi5xly5blampq8n6/3/F6vQ6/3+/4fD7H4/E4HR0dRW9hYaG4ePFi' +
  '5+yzz87fc8896aeffjq/a9eudH9/f7G1tbWwoqIi39nZWWhtbS00NzcX6urqnDVr1jiNjY1OIBBwOjs7ncrKSqesrMz59a9/nZqbm0s9' +
  '99xzud27d6cGBweLg4ODqcHBweKqVavynZ2dzurVq/MtLS35uro6p66uzmlqanKXL19eqKioKNTV1RUqKyuLgUAgv2HDhvzq1avzbW1t' +
  'qaVLlyZ37NjhPPXUU8WjR4+Wnn/++fz4+Hjx2LFj+TNnzrxw9OjR0ubNm0ulpaXFixcvLl62bFlxaGio2N/fX/zMZz7j7NixI/Xee++l' +
  'Nm3alF+yZEm+o6Mj39raWlhYWFhYWFjo6up63T//8z9fee655776j//4j5+9+uqrX7127do/eOCBB/5ubGzs37W3t7+2p6fn/ywrKyt' +
  'UV1eX3r/u3/3d373mtttu2/3zn//8t/bs2XPHmjVr/vTtb3/73x8/fvzvh4aG/ri/v//PX3jhhdsWL17s+P3+oMvlcpqbmwsLFy4sLFm' +
  'ypNDS0lJobW0ttLS0FBYuXFhYtGhRoampiVdffbW4Zs2a4kMPPZSfnp52hoaGcoFAwGlpaSmcdNJJqS1btqSefPLJYnt7e6G+vr5QWVlZ' +
  'qKysLFZVVbnKysp8ZWXlz82W1atXFzds2ODccccdqePHjxePHDniPPvss8Xdu3fnjx49WhweHs4vLS3NX7JkSX7JkiX59evX51tbWwvl' +
  '5eVORUWFU15e7pSXl7sWL17sWbVqVXHv3r3F/fv3F1tbWwsNDQ1OTU1NoampyV2/fv3/uW7dup/v2rXLffzxxwt79+51NmzY4CxdutRZ' +
  's2ZNsaenp9Da2upUVFQUHQ6HQ4fD4QSAw+12O5/4xCeKBw4cKM3MzDjnnHNOpqmpqdDa2lro6OhwGhoanPXr17t2dnZ23Xbbbbdu27bt' +
  '4u7u7ouXLFlSWLRoUaGqqspxOBzOypUrixs2bCi++eab+bvvvjv30EMP5e+88878zp078zMzM6mNGzemPvOZzzjHjx9PTU1N5Wtra51' +
  'AIOD09/c7HR0dRehYfPGLX1x88cUXi3Nzc8WhI0eKp06dKo2Pj5eOHj1aOnTokPO7v/u7hfr6+kJNTU2hpqamUFFRUVi6dGlh0aJFhaqq' +
  'qkJBQUGhtra28MlPftI56aSTnM2bN6eOHz+e3717d3FmZsbZsmVLqqmpqbBo0aJCfX19oaKiwtHV1bX/9ttvf+2CBQu6/uu//mv7//zP' +
  '//x1f3//3w4PD79m/fr1/3hoaGj/rbfeeu+6devO6ejoOGd8fPx/r1q16q+am5svbGpqOvHkk08ujI2N/U1ra+sFLS0tFzQ1NZ1QXFx8' +
  '4m9/+9t/Hxoaeu3Q0NCfDw0NvWb//v3vvummm/56ZGTE3b17d+r48ePp+vp658ILL8y/8cYb+Z/85Cfvve222167e/fuv5+fn//Pvb29' +
  'f7F+/fq/q6ioKHZ0dDgbN27MPf/8885tt92W2rFjh/ONb3zDefvtt4uPPvpoanJyMn/RRRel1q5dm2pra8u3trYWFhQU5CsqKgpVVVWO' +
  'y+VyampqnOrqamfVqlXOpk2bcg899FDx+PHjpffeey//7LPPFsfHx/MzMzP5hoYGp6amxmloaHDKysqcAoHAwW/7tm/73s/N1tbW13Z2' +
  'dr6yp6fnvPHx8Vfdfffdt61ater8wcHBFx4+fPj2v/mbv7n/5ptvvm/ZsmXnnnvuuf84Pj7+1y0tLRd2dHRcWFxc/G87OzvPb29v/z8t' +
  'LS0Xt7e3X1RcXPyqzs7OF7S3t7+ir6/vwtbW1ov6+vpeMDAw8Irh4eFXDA8Pv2Z0dPQ/Dw0N/c2xY8du37lz591r167tv+aaa/KvvPJK' +
  'bmBg4LVXX331v6xevfrvNm3adGl7e/uFxcXFhcbGxr/48Y9/fPvY2Njf/d3f/d1v7dix4y83btz44o6ODmddba1z6NCnUtPT06nPfOYz' +
  'zpkzZ1JjY2OpdevWpfbv35/v7e0tdnd3O52dncWurq58RUVFsaKiouhyuRwFAoFA/P79+4uDg4PF+vp659hjj813d3c7q1atcq6//vrU' +
  'DTfcUBwbGyvv37+/dODAgbwzZ84Ur7766lRPT0+xrKzM8fv9AcfvcDgcAcfv8zkCfr9/8B3veMd/m56e/tKqVav8f/iHf3hpd3f3Be3t' +
  '7ecNDg6+dmho6LU9PT3ntbe3v7SpqeklfX19rxgZGfn9gYGBCzo7O1/c2dn5ktHR0f+2ffv2r8zNzX39uuuu+9v+/v4/HBkZ+d+Hh4f/' +
  'qK+v75XDw8OvX7FiRWrDhg3O9PT0709NTX3zvvvu++pDDz30l1u2bLk4lUqlfvd3f7d45513OmvWrCn6/f7gwoULC16v1/n4xz/unHTS' +
  'Sc6ll16aevDBB4vbt29P/eQnP0nt27cvPzo6murp6cl7PB7H7/c7y5YtK/T09Dg1NTX5xsZG5/jx4/lbb701tWPHjvzOAwf+tqKiwp1O' +
  'p4u33XZbft++fen169c7tbW1TuDy5cs7mpqa/uzw4cN3zs7OfvXaa6/9x3vvvfcfuru7L7z88suLXV1dznXXX5968MEHnQ0bNqS6u7vz' +
  'LS0tqfn5+eKWLVtSW7Zscfr7+x2fz+f8y7/8y1f/9V//df/s7Oz3hoeHL1q/fv1vdHR0XNDV1XXBu971rlded911F7e2tp47Ojp6xoc+' +
  '9KGXf+ELX3jVmjVrHIfD4QQCgeD73vc+x+l0OmvWrHF+/OMf53bu3Fm85557UjfeeGNq4cKFuZqaGsfj8biCwWAoHA4Hg8Fg4K1vfWve' +
  '4XA4/H6/4/f7g36/3+HxeByn0+msXr06t2zZsnxDQ4PT0tLi+P1+x+PxOA6Hw/F4PA6Hw+F4vV4nGAw6Ho/Hqaurc7q6upz6+nrnwx/+' +
  'sLNo0SLnsssuK46MjDi9vb3FkpKS/ODgYPLtb3871dbWluro6HA2bNiQam9vzzc2NqYWLFiQd7vdDr/fH/z93//91PT09Jc3bNhwfn9/' +
  '/2v7+/tfOzg4+MrVq1c7a9aseeGhhx56eXJy8rZt27Z9eXZ29uu7du36/2ZmZv76vvvuu2N8fPzq5cuXO+vWrXMWLlzofO5znys9+OCD' +
  'qVtuuSX19a9/PX/33Xen7rrrrtRnPvOZ3OjoaL6uri5XXV1dqKmpKaRSqZQzkUgkPv/5zxe/8pWv5Hft2pU6e/bs7U888cRtMzMz/9vf' +
  '3//H/f395/f09Lxs+fLlhampqfyhQ4dSra2tqZqaGsc/FAqFAgUFBY4zGAwGfD6fU1JS4lRUVDiVlZXOkUce6axcudJpamrKV1RUpPx+' +
  'v8PtdjtdXV15h8PhdHd35+vr6/NLS0udkpKSfHl5uTM4OJjbsWOHMzw8XBgaGnK2bt3qbN261bnzzjtTIyMjhUceeST34IMPFj/60Y8W' +
  '77777sKzzz6bGh8fTz3wwAP5gwcPpnbu3OlMTk6mXnjhhdS73vWuwqZNm1JPP/108Xvf+97/9u///u+/NTIy8poLLrjg1YODg69qbW19' +
  'WWdn5ysbGhoKt9xyS2rv3r2pl156yenevn37V/bt2/dHs7Ozn7/33nvvOHr06AunTp26Y8+ePXeOjIxcdNxxxxWPP/744ve///3cE088' +
  'kb777rvTDz/8cOqBBx5Ivfe9703dfPPN+T179qRefPHF4r/927/lz549e3vHjh1fmJqaum1mZubvT5w4ccfIyMiF7e3tr1q3bl3x1KlT' +
  'jnvp0qWupUuXOkuWLHGampqcuro6p7Ky0l2+fHlx7dq1xbVr1+a7urqc6upqp6qqyqmsrHQqKiqcoqKi/MDAQLGvr8/Zu3dv6vXXXy8+' +
  '+eSTxd/93d8tTk1NFScmJkrPP/988fDhw6VTp04VJyYmSi+//HJxenq6eOzYseKxY8dKx44dKx09erR46tSp4tTUVP4LX/hC/rHHHst/' +
  '//vfT01NTTkjIyP50dHRVEtLS3758uX51tbW4hFHHFF84IEHis8888z/mZqaev6uu+76u4mJid9dtmzZBWvWrHnhoUOHvvzEE098+dCh' +
  'Q/dMTk7eNj8//821a9eedcsttxTuuOOO3MmTJ1Ozp06d+vLU1NRtMzcz88WZ6enpx6enp781PT19x8zMzDenp6dvf/nll/9rT0/PeUND' +
  'Q6/q6en5476+vn84NDR07pkzZ1IPP/xwqq2trVBZWVkIBAIFj8fj8Hg8jtfndThdXV2uyy67zHn55ZcL8/Pzxf/8z/8sfPrTny6++OKL' +
  'xampqeLx48eLJ0+eLB4/frx44sSJ4smTJ/M/+tGPiu94xzuKa9eudR599NHi5ORE8eKLL3befvvt4hNPPFG85pprnO985zvFnTt3Fk+d' +
  'OlW88847i0NDQ/mOjo782rVri6effnrx7//+7/84MzPzhbNnz359fH7+9mPHj/9rV1fXBf39/Rf19PS8or29/eUrV67M33nnnfmtW7em' +
  'nnvuuVR3d3d+3bp1xeXLlxfq6uqcpqam4PDw8Gt//OMf/8vU1NS/TE5OfmFqauryDRs2vGzDhg1/2NPTc0FXV1exvr7ece3du9e1bdu2' +
  '9MmTJ513v/vdzuuvv55/7rnnipOTk8WDBw8WJyYm8idOnMhPTk7mH3/88eKDDz6Y2rVrl/PTn/40v2XLluL111+fv/XWW4vHjx8vTktL' +
  'S/HgwYPFxx9/vPjggw8WT5w4UTxy5EjxxIkTxXvuuaf4y1/+snjLLbckrr322mJZWVn+7rvvLrS2tub37t2bqq6udtra2pxvf/vb+U98' +
  '4hOFSy+9tLi0tDT/r//6r8UDDzxgf+5zn/v3sbGxP7rlllu+tWXLlq+sX7/+omXLluXHxsbyhw4dcjo7OwsNDQ35qqqq/MDAQLGnp8ep' +
  'qqoq9vT0FIeGhor9/f3Ftra2wv79+wvXX3998fbbb8/t3bs3PTw8XGhtbS2sWrWquHbt2nxzc3Ohra2tsHz58uLjjz+e2r59e379+vXF' +
  'pqamfCAQCAUCgfyTTz6Zmj1x4sT3Z2ZmfvPkyZP3PfHEE1/dvn37X23atOn/7u7uvrS/v7/Y1tbmdHd3O1u2bHF6e3ud4eHhwuDgYGFq' +
  'aiq1devWVE1NTb6mpiafSqUK5eXlxba2tsLg4GBxcHCw0NPTU7jwwgvzp512Wv6ee+4pDg4OpoLB4ODMzExqfn6+uLq6mh8YGCgMDQ0V' +
  'BwcHi8PDw4WBgYF0d3d3evXq1YXLLruscMsttxQ/8YlPFGfPnj1/6NCh27/xjW/8+urVq88eGRn59wMDAxd3dHRc1NLSclFHR8fFHR0d' +
  'F3d0dLxqaGjoNa2tra/p7u5+RWdn50UdHR0XdnR0/ENzc/P3uru7r+zp6bn49NNPf/WaNWtc+/btK87Pz6fee++91OOPP56fnJzMT09P' +
  'p44dO5b/xCc+kbp48eLij370o8LRo0cT4+Pjxd/93d8tNjY2OseOHTu2Z8+eO2dnZ79933333TE+Pv6e9vb2V/T39798eHj49YODg2e0' +
  'trZe3NLS8tpVq1a9cXBw8FXDw8OvGRoaet3g4ODrt27d+vW77777O7fffnv+zJkz+YULF6be9a53FdevX58/7bTTXn7HHXf8xRtvvPFF' +
  '79KlS7vXrFmz/5ZbbvlOa2vrxevXr79oaGjo1W1tbS8fGhp6xeDg4Gv6+/tfPjQ0dO3w8PCrV65c6Tx44EBqbm4u/8ADDxRPnDjhvPXW' +
  'W8UTJ04Ub7vttvy6deuK5eXlhVOnTiU2btz40o0bN164bt26cw8cOPBP119//b/v3r377iNHjnxzdnb2W/Pz87/76KOP3jY7O/v1p59+' +
  '+vb5+fnvLC4udq9Zs+avuru7L2hvb7+oo6Pj4p6enotbW1tf0dLScnF7e/vFHR0dF7e0tLyipaXl/y1cuPC8wcHBVw4ODr5qaGjo/zY3' +
  'N5/b1NT0+jPPPPP8wcHBCw8ePJh76KGHiidOnChecsklxRtvvDF/yy235Dds2FCsra11Ojs784FAwBFCOHXv3r3/7fnnn/+bRx555K/G' +
  'xsau7+7uvrCnp+eC9vb2C1pbW1/W1NT0sq6urotaWlpe0dzcfF57e/uFLS0tr+jo6Ligvb39/JaWlpd1dHRc1NLSckFTU9P5HR0dFzc3' +
  'N5/b3t5+4ejo6Jmjo6N/3tbW9oqmpqYLe3p6zmlubn7t2rVrL+/t7b2gpaXlpS0tLa/t6Oi4qKur66Lu7u6L2traLunq6rqkq6urq6en' +
  '5+Kenp6LmpqaLmpsbLygtbX1/La2tlf09fW9pq2t7ZVtbW2vbm9vf1lHR8fF7e3tr2hpaTnv1FNPvbSjo+OCrq6ui9rb2y/p6Oh4RXt7' +
  '+6t7e3tfPTAw8IqOjo5X9PT0vKKrq+vCzs7OV7S3t7+yo6Pjop6enou6u7sv7OnpuaCnp+eC9vb2C1paWl7Z2dn58p6enld0dHRc0NLS' +
  'cv6pp576qq6urova2tou6ezsfGVPb++rnX766a/p6Oi4qLOz8+UdHR0Xt7S0XNLS0nJRR0fHRZ2dnRd2dnZe0NLSckFXV9dFHf39F51x' +
  'xhnf2bBhw2u6urou6ejoOGd4ePgV7e3tr+jo6Ligubn5/I6Ojou6u7svbm9vf2lLS8sFTU1N53d1df2bAwcOvPHpp5++4+jRo3eNjY1d' +
  'eeyxx7516NCh2w8fPvzdkydP3nDixIl7pqen7zx16tT3Dh8+/J1Dhw7dcXh8/M5Tp07d8cwzz9xx7Nix23fv3n37oUOH7jx8+PD3Dxw4' +
  'cMfhw4e/e/z48dufeeap22ZnZ+88cuTInadOnbpnbGzsuydOnPjuAw888M3Tp0/f8cILL9x58uTJ255//vk7jh07dvszzzzzzffee+87' +
  'hw8fvufUqVN3Hjh06DuHDx++48CBA985efLknc8888ztk5OTt42Pj3/vwIED3z9w4MB3n3/++W+ePHnynkOHDt35wAMPfPfAgQN3nDlz' +
  '5o5Tp07deezYsdv37Nlzx8GDB79z9OjRPz127Nh3Dx06dOeBAwfueOihh+48cuTIHYcOHbptbW3tuk2bNr2ys7PzgtbW1vN7enouam1t' +
  'faW/v/+1LS0tr1y9evX5HR0dr+rp6Xn5wMDA6zs7Oy848cQTX9XZ2Xl+e3v7K1tbW1/Z1NT0qubm5gs6OzsvaGpqOr+tre28zs7O8zs6' +
  'Olr6+/sv6unpubCjo+PC9vb2V7S1tb2yra3tlU1NTa/q7e19dU9Pz6sGBgZetWbNmr/r7Ox8eWdn58u6u7svam1tvbCtbWioq2toqKur' +
  'a2ioq6vra2tr6+rq6mrv6ek5p7u7+6L+/v6LOjs7L2hvb7+oo6Pjgvb29lf09PS8rKOj46LOzs6L2traLunr63tVT0/Phf39/Rf19/e/' +
  'sqen58IeB7/e/v7+1/X19b22t7f3td3d3RcsXLjw9d3d3a/q6Oh4VW9v70V9fX2v6O/v/5PBwcFXDg8Pv3ZwcPCN/f39r+rq6rqwvb39' +
  '4u7u7ou7u7svbm5uPq+trf1lzc3N53V1dV3Q1tb2it7e3ld1d3df1NnZ+aqurq6Lunp6Lurq6rqou7v7os7Ozkva29sv7uzsvLi3t/fi' +
  'np6eC/v6+l41MDBwQUdHx8UdHR0Xt7W1vaqlpeX8lpaW13R1dV3U0dFxYUdHx4UdHR0XdnZ2vrSzs/PCjo6Oi3p6el7W09NzQUdHx0Ud' +
  'HR0XdnZ2vqq9vf3VHR0dF3Z1db2qpaXllb29vRf19fW9fGBg4IK+vr5Xtbe3n9fR0fGa1tbW/9fd3f2qlpaW/7927dovr1+/vrOzs/OC' +
  '9vb2izs6Oi7q6uq6qKur66Lu7u6Luru7L25sbLygvb395V1dXRf19vZedPTRR7+ir6/v4q6urgt7e3tfPTAw8Io1a9Zc0NLSclFHR8fF' +
  'HR0dF7e2tp7X0dFxYVtb2wVtbW0XtLS0vKK7u/tVAwMD5/f29p7f3d19QXNz8ys7Oztf2d3d/bKurq6Lunp6Lu7q6rqko6PjvI6Ojou7' +
  'urou7ujoeE1PT8+re3t7X93V1XXBqVOn/mhkZOTTbW1tv79+/fo/XLt27YV79+79c09Pz0sPHDjw5u3bt/9bZ2fnq9ra2v5fe3v7Szo6' +
  'Oi5obW19RUtLy3ltbW2v6unpuaSjo+OVPT095/T397/y+PHj/3ZgYOD1Bw8e/Nz69evP27Vr158PDQ29pqWl5XWdnZ0Xt7e3X9jc3PzK' +
  '9vb2V3V2dr6su7v74q6urku6u7svamxsfGFbW9sFHR0dF3Z2dl7Y29v72vb29ou7urovaWtre3lvb+9renp6/kFHR8fFPT09F/X29l7a' +
  '29t7UWdn54UdHR0XtbS0vKKjo+OV/f395/T397+qu7v7op6enou6u7sv7urquqijff/Gjo6OCzs6Oi7s6Oj4/3R2dl7Y0dFxUXd398Ud' +
  'HR0Xt7W1vaqjoeMVrW1t53d1df3L8PDwqwYHB884fPjwX+/Zs+drIyMjv3/y5Mnv3Hnnnb99++23337vvffedeTIkW/v27fvb59//vlv' +
  'rK2tvfWVV1657cEHH/z2mTNnbr/99tv/cteuXbevW7fujtOnT9+xf//+bx0+fPj2vXv3/u2RI0e+9eSTT353fn7+9kOHDt1+6tSpb8/P' +
  'z9/57rvvfvvQoUO3T05O3r5nz547jh8/fufMzMy3Hzhw4M5Dhw7d8fzzz39rfHz8m2+99dZdhw8fvuv06dPfeeqpp24fHx+/88iRI3fOz' +
  's5+88knn7x9165d33nuuee++eCDD955+PDh7z377LPfeurUqTv27t17x9jY2N/v2bPnzuPHj99+8uTJ25999tnb5+fnvzU/P3/72bNn' +
  '7zhx4sQd+/bt+86TTz555+7du7/zzDPP3DE3N3fHqVOn7ti5c+edMzMz3zpx4sQde/bsuevAgQN3TE5O3nbq1Kk7du/e/Z2jR4/eeejQ' +
  'oTvOnj175+zs7DcOHz58x5kzZ+64995775iYmLjtySef/PbIyMh5J06c+Ptz587dcfDgwW+99tprdz3yyCN3jI2NfWvXrl13TE5O3vbM' +
  'M898++zZs3ccPXr0WwcOHLjz5MmTd46Njd3x6quv3vnSSy/deezYsW8fPHjwm2fPnr19fHz8jkuv3fb/Abw6oY/575hMAAAAAElFTkSu' +
  'QmCC';

interface PaymentProofModalProps {
  visible: boolean;
  onClose: () => void;
  // Mode: 'UPLOAD' (penitip uploads proof) or 'REVIEW' (runner views & verifies proof)
  mode: 'UPLOAD' | 'REVIEW';
  // Context info
  sessionId: number;
  currentUserId: number;
  buyerName: string;
  bankName?: string | null;
  bankAccount?: string | null;
  bankHolder?: string | null;
  totalBill?: number;
  // If in review mode or already uploaded:
  targetUserBill?: UserBillDetail;
  onConfirmApprove?: (targetUserId: number) => Promise<void>;
  onConfirmReject?: (targetUserId: number, alasan: string) => Promise<void>;
  onUploadSubmit?: (catatan: string, base64Image: string) => Promise<void>;
}

export const PaymentProofModal: React.FC<PaymentProofModalProps> = ({
  visible,
  onClose,
  mode,
  buyerName,
  bankName,
  bankAccount,
  bankHolder,
  totalBill,
  targetUserBill,
  onConfirmApprove,
  onConfirmReject,
  onUploadSubmit,
}) => {
  // Upload State
  const [catatan, setCatatan] = useState('');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review Reject State
  const [isRejecting, setIsRejecting] = useState(false);
  const [alasanTolak, setAlasanTolak] = useState('');
  const { showSuccess, showError, showWarning } = useAlert();

  const proof = targetUserBill?.payment_proof;
  const isAlreadyApproved = proof?.status === 'APPROVED' || targetUserBill?.is_all_paid === true;

  // Handle Pick from Gallery
  const handlePickGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
        includeBase64: true,
      });

      if (result.didCancel) return;
      if (result.errorMessage) {
        showError('Gagal Membuka Galeri', result.errorMessage);
        return;
      }

      const asset = result.assets?.[0];
      if (asset) {
        if (asset.base64) {
          setSelectedImage(`data:${asset.type || 'image/jpeg'};base64,${asset.base64}`);
        } else if (asset.uri) {
          setSelectedImage(asset.uri);
        }
      }
    } catch (err: unknown) {
      showError('Error', err instanceof Error ? err.message : 'Gagal membuka galeri foto');
    }
  };

  // Handle Take Photo with Camera
  const handleTakePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
        includeBase64: true,
      });

      if (result.didCancel) return;
      if (result.errorMessage) {
        showError('Gagal Membuka Kamera', result.errorMessage);
        return;
      }

      const asset = result.assets?.[0];
      if (asset) {
        if (asset.base64) {
          setSelectedImage(`data:${asset.type || 'image/jpeg'};base64,${asset.base64}`);
        } else if (asset.uri) {
          setSelectedImage(asset.uri);
        }
      }
    } catch (err: unknown) {
      showError('Error', err instanceof Error ? err.message : 'Gagal membuka kamera');
    }
  };

  // Handle Submit Upload
  const handleSendProof = async () => {
    if (!selectedImage) {
      showWarning('Pilih Gambar', 'Silakan pilih gambar bukti transfer terlebih dahulu.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (onUploadSubmit) {
        await onUploadSubmit(catatan.trim(), selectedImage);
      }
      onClose();
      showSuccess(
        'Bukti Terkirim! 🎉',
        'Bukti transfer berhasil dikirim ke Runner untuk diverifikasi.'
      );
    } catch (err: unknown) {
      showError(
        'Gagal Mengunggah',
        err instanceof Error ? err.message : 'Terjadi kesalahan'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Runner Approve
  const handleApprove = async () => {
    if (!targetUserBill?.userId || !onConfirmApprove) return;
    try {
      setIsSubmitting(true);
      await onConfirmApprove(targetUserBill.userId);
      onClose();
      showSuccess('Pembayaran Lunas ✅', `Pembayaran ${targetUserBill.nama} berhasil disetujui.`);
    } catch (err: unknown) {
      showError(
        'Gagal Menyetujui',
        err instanceof Error ? err.message : 'Terjadi kesalahan'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Runner Reject
  const handleReject = async () => {
    if (!targetUserBill?.userId || !onConfirmReject) return;
    if (!alasanTolak.trim()) {
      showWarning('Alasan Diperlukan', 'Harap isi alasan penolakan agar penitip tahu apa yang salah.');
      return;
    }
    try {
      setIsSubmitting(true);
      await onConfirmReject(targetUserBill.userId, alasanTolak.trim());
      setIsRejecting(false);
      onClose();
      showSuccess('Bukti Ditolak ❌', `Bukti pembayaran ${targetUserBill.nama} telah ditolak.`);
    } catch (err: unknown) {
      showError(
        'Gagal Menolak',
        err instanceof Error ? err.message : 'Terjadi kesalahan'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resolve image URI to display
  const resolveImageUri = (): string => {
    if (mode === 'UPLOAD') {
      return selectedImage;
    }
    if (proof?.bukti_url) {
      if (proof.bukti_url.startsWith('http') || proof.bukti_url.startsWith('data:')) {
        return proof.bukti_url;
      }
      return `${SOCKET_URL}${proof.bukti_url}`;
    }
    return SAMPLE_RECEIPT_BASE64;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.title}>
                {mode === 'UPLOAD' ? 'Unggah Bukti Transfer' : 'Verifikasi Bukti Transfer'}
              </Text>
              <Text style={styles.subtitle}>
                {mode === 'UPLOAD'
                  ? `Kirim bukti pembayaran ke ${buyerName}`
                  : `Bukti dari ${targetUserBill?.nama || 'Penitip'}`}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {/* Info Summary Card */}
            {mode === 'UPLOAD' ? (
              <View style={styles.bankBanner}>
                <CreditCard size={18} color={Colors.primary} />
                <View style={styles.bankBannerInfo}>
                  <Text style={styles.bankBannerLabel}>
                    Tujuan Transfer: {bankName || 'Rekening'} • {bankAccount || '-'}
                  </Text>
                  <Text style={styles.bankBannerHolder}>
                    a/n {bankHolder || buyerName}
                  </Text>
                  {totalBill !== undefined ? (
                    <Text style={styles.bankBannerAmount}>
                      Nominal: Rp {totalBill.toLocaleString('id-ID')}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : (
              <View style={styles.reviewBanner}>
                <View style={styles.reviewBannerRow}>
                  <Text style={styles.reviewLabel}>Penitip:</Text>
                  <Text style={styles.reviewValue}>{targetUserBill?.nama} (WA: {targetUserBill?.no_whatsapp})</Text>
                </View>
                <View style={styles.reviewBannerRow}>
                  <Text style={styles.reviewLabel}>Total Tagihan:</Text>
                  <Text style={styles.reviewValueBold}>
                    Rp {(targetUserBill?.total_bayar || 0).toLocaleString('id-ID')}
                  </Text>
                </View>
                <View style={styles.reviewBannerRow}>
                  <Text style={styles.reviewLabel}>Status Bukti:</Text>
                  <View
                    style={[
                      styles.statusTag,
                      isAlreadyApproved && styles.statusTagApproved,
                      !isAlreadyApproved && proof?.status === 'REJECTED' && styles.statusTagRejected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusTagText,
                        isAlreadyApproved && styles.statusTagApprovedText,
                        !isAlreadyApproved && proof?.status === 'REJECTED' && styles.statusTagRejectedText,
                      ]}
                    >
                      {isAlreadyApproved
                        ? '✅ Disetujui (Lunas)'
                        : proof?.status === 'REJECTED'
                        ? '❌ Ditolak'
                        : '⏳ Menunggu Konfirmasi'}
                    </Text>
                  </View>
                </View>
                {proof?.catatan ? (
                  <View style={styles.noteBox}>
                    <FileText size={14} color={Colors.textSecondary} />
                    <Text style={styles.noteText}>Catatan: "{proof.catatan}"</Text>
                  </View>
                ) : null}
                {proof?.alasan_tolak ? (
                  <View style={[styles.noteBox, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
                    <XCircle size={14} color={Colors.danger} />
                    <Text style={[styles.noteText, { color: Colors.danger }]}>
                      Alasan Ditolak: "{proof.alasan_tolak}"
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Proof Image Section */}
            <View style={styles.imageCard}>
              <View style={styles.imageCardHeader}>
                <Text style={styles.imageCardTitle}>
                  {mode === 'UPLOAD' ? 'Foto Struk / Bukti Transfer:' : 'Foto Bukti Pembayaran:'}
                </Text>
                {mode === 'UPLOAD' && selectedImage ? (
                  <TouchableOpacity
                    onPress={() => setSelectedImage('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.resetImageText}>Hapus Foto</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {mode === 'UPLOAD' ? (
                <>
                  {/* Action Buttons to Choose Gallery or Camera */}
                  <View style={styles.pickerBtnRow}>
                    <TouchableOpacity
                      style={styles.pickerBtn}
                      onPress={handlePickGallery}
                      activeOpacity={0.7}
                    >
                      <ImageIcon size={18} color={Colors.primary} />
                      <Text style={styles.pickerBtnText}>Pilih dari Galeri</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.pickerBtn}
                      onPress={handleTakePhoto}
                      activeOpacity={0.7}
                    >
                      <Camera size={18} color={Colors.primary} />
                      <Text style={styles.pickerBtnText}>Buka Kamera</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Preview Container or Empty Placeholder */}
                  {selectedImage ? (
                    <TouchableOpacity
                      style={styles.imageWrapper}
                      onPress={handlePickGallery}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={{ uri: resolveImageUri() }}
                        style={styles.proofImage}
                        resizeMode="contain"
                      />
                      <View style={styles.changeOverlay}>
                        <RotateCw size={12} color="#FFFFFF" />
                        <Text style={styles.changeOverlayText}>Ketuk untuk ganti foto</Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.emptyImageWrapper}
                      onPress={handlePickGallery}
                      activeOpacity={0.7}
                    >
                      <UploadCloud size={36} color={Colors.primary} />
                      <Text style={styles.emptyImageTitle}>Pilih Foto Struk Transfer</Text>
                      <Text style={styles.emptyImageSub}>
                        Ketuk tombol di atas atau area ini untuk mengambil dari galeri ponselmu
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Quick Simulated Receipt for Testing */}
                  <TouchableOpacity
                    style={styles.sampleReceiptBtn}
                    onPress={() => setSelectedImage(SAMPLE_RECEIPT_BASE64)}
                    activeOpacity={0.7}
                  >
                    <Sparkles size={13} color={Colors.primary} />
                    <Text style={styles.sampleReceiptText}>
                      Gunakan contoh struk simulasi (untuk testing cepat)
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: resolveImageUri() }}
                    style={styles.proofImage}
                    resizeMode="contain"
                  />
                </View>
              )}
            </View>

            {/* Upload Note Input */}
            {mode === 'UPLOAD' && (
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Catatan Tambahan (Opsional):</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: Sudah ditransfer via BCA jam 14:30 a/n Rahma"
                  placeholderTextColor={Colors.textMuted}
                  value={catatan}
                  onChangeText={setCatatan}
                  multiline
                  numberOfLines={2}
                />
              </View>
            )}

            {/* Reject Form Input (Runner Mode) */}
            {mode === 'REVIEW' && isRejecting && (
              <View style={styles.rejectSection}>
                <Text style={styles.rejectLabel}>Alasan Penolakan Bukti:</Text>
                <TextInput
                  style={styles.rejectInput}
                  placeholder="Contoh: Uang belum masuk di mutasi / Nominal kurang Rp 5.000"
                  placeholderTextColor={Colors.textMuted}
                  value={alasanTolak}
                  onChangeText={setAlasanTolak}
                  multiline
                />
                <View style={styles.rejectActionRow}>
                  <TouchableOpacity
                    style={styles.cancelRejectBtn}
                    onPress={() => setIsRejecting(false)}
                  >
                    <Text style={styles.cancelRejectBtnText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmRejectBtn}
                    onPress={handleReject}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.confirmRejectBtnText}>Kirim Penolakan</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            {mode === 'UPLOAD' ? (
              <TouchableOpacity
                style={[styles.primaryBtn, isSubmitting && styles.disabledBtn]}
                onPress={handleSendProof}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <UploadCloud size={18} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>Kirim Bukti Transfer</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : isAlreadyApproved ? (
              <View style={styles.approvedFooterContainer}>
                <View style={styles.approvedBanner}>
                  <CheckCircle2 size={20} color={Colors.success} />
                  <View style={styles.approvedBannerTexts}>
                    <Text style={styles.approvedBannerTitle}>
                      Pembayaran Telah Dikonfirmasi Lunas
                    </Text>
                    <Text style={styles.approvedBannerSub}>
                      Bukti transfer telah disetujui. Tagihan penitip ini sudah lunas.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.closeFooterBtn}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.closeFooterBtnText}>Tutup</Text>
                </TouchableOpacity>
              </View>
            ) : !isRejecting ? (
              <View style={styles.reviewButtonRow}>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => setIsRejecting(true)}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  <XCircle size={18} color={Colors.danger} />
                  <Text style={styles.rejectBtnText}>Tolak Bukti</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={handleApprove}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <CheckCircle2 size={18} color="#FFFFFF" />
                      <Text style={styles.approveBtnText}>Konfirmasi Lunas</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    maxHeight: 480,
  },
  bodyContent: {
    padding: 20,
  },
  bankBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    marginBottom: 16,
  },
  bankBannerInfo: {
    flex: 1,
  },
  bankBannerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  bankBannerHolder: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  bankBannerAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 3,
  },
  reviewBanner: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 6,
  },
  reviewBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  reviewValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  reviewValueBold: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
  },
  statusTagApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusTagRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  statusTagApprovedText: {
    color: '#166534',
  },
  statusTagRejectedText: {
    color: '#991B1B',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  noteText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    flex: 1,
  },
  imageCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  imageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  imageCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  resetImageText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.danger,
  },
  pickerBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  pickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 10,
    borderRadius: 10,
  },
  pickerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  emptyImageWrapper: {
    height: 180,
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyImageTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  emptyImageSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  imageWrapper: {
    height: 220,
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  changeOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeOverlayText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sampleReceiptBtn: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  sampleReceiptText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  proofImage: {
    width: '100%',
    height: '100%',
  },
  imageHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  imageHint: {
    fontSize: 11,
    color: Colors.primary,
    flex: 1,
  },
  inputSection: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  rejectSection: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
  },
  rejectLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.danger,
    marginBottom: 6,
  },
  rejectInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: Colors.textPrimary,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  rejectActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  cancelRejectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  cancelRejectBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  confirmRejectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.danger,
  },
  confirmRejectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  reviewButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 14,
    borderRadius: 14,
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.danger,
  },
  approveBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.success,
    paddingVertical: 14,
    borderRadius: 14,
  },
  approveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  approvedFooterContainer: {
    gap: 10,
  },
  approvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
  },
  approvedBannerTexts: {
    flex: 1,
  },
  approvedBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  approvedBannerSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 2,
  },
  closeFooterBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeFooterBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
