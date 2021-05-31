import { Component, OnInit } from '@angular/core';

import {
  NavParams,
  ModalController
} from '@ionic/angular';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
})
export class AboutPage implements OnInit {

  private bgService: any;

  constructor(private modalCtrl: ModalController, private navParams: NavParams) {
    this.bgService = this.navParams.get('bgService');
    this.bgService.playSound("FLOURISH");
  }

  ionViewDidLoad() { }

  onClickClose() {
    this.bgService.playSound("CLOSE");
    this.modalCtrl.dismiss();
  }

  ngOnInit() {
  }

}
