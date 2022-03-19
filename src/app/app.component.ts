import { Component, Injectable, OnInit, SimpleChange } from '@angular/core';
import { FormBuilder, FormArray, FormControl, AbstractControl, ValidationErrors, AsyncValidator, FormGroup, ControlContainer, Validators } from '@angular/forms'
import { ApiService } from './apiService'; // api
import { of, Observable, Subject } from 'rxjs';
import { switchMap, map, tap, filter, take, startWith, delay } from 'rxjs/operators'
import { validateConfig } from '@angular/router/src/config';
// export class UniqueUserNameValidator implements AsyncValidator {
//   constructor(private service: ValidationService) {}

//   validateUserName(ctrl: AbstractControl): 
//     Promise<ValidationErrors | null>| Observable<ValidationErrors | null> {
//     return this.service.checkUserName(ctrl.value).pipe(
//       // 如果已存在，return出错误信息
//       map(isExist=> (isExist ? { uniqueUserName: true } : null)),
//       catchError(() => null)
//     );
//   }
// }
// export class ValidationService {z
//   checkUserName(userName: string): Observable<boolean> {
//     // 发送http请求，将结果return
//     const path = `***`
//     this.httpService.get(path, {userName: userName})
//         .subscribe(res => {
//           // of会创建一个 Observable，它会依次发出由你提供的参数，最后发出完成通知。 
//             return of(res.result)
//         })
//   }
// }
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';
  //  动态表单验证
  dynamicList = [{ id: '0', code: '' }]
  dynamicGroupList = []
  dynamicForm: FormGroup
  groupDynamicForm: FormGroup
  compareForm: FormGroup
  conditionalForm: FormGroup
  isChecked: boolean = true
  validateForm = {
    isEmpty(c: FormControl) {
      debugger
      if (!/\S/.test(c.value)) {
        return {
          message: '请输入信息'
        }
      }
      return null
    },
    compare(from, to) {
      return (group: FormGroup): { [key: string]: any } => {
        let f = group.controls[from];
        let t = group.controls[to];
        if (f.value > t.value && /\S/.test(t.value)) {
          return {
            compareMessage: "最大值应比最小值大"
          };
        }
        return null
      }
    }
  }
  formSubmitSubject$ = new Subject()
  constructor(private fb: FormBuilder, private service: ApiService) { }
  eachForm: FormGroup //
  ngOnInit(): void {
    // 等待异步验证回来，在提交表单
    this.formSubmitSubject$
      .pipe(
        tap(() => this.registorForm.markAsDirty()),
        switchMap(() =>
          this.registorForm.statusChanges.pipe(
            startWith(this.registorForm.status),
            filter(status => status !== 'PENDING'),
            take(1)
          )
        ),
        filter(status => status === 'VALID')
      )
      .subscribe(validationSuccessful => {
        console.log('success')
      });

    // 遍历接口表单验证
    this.eachForm = this.fb.group({})
    this.addValidForm()

    // + - 动态
    this.dynamicForm = this.fb.group({
      name: ['', [Validators.required]],
      cardArray: this.fb.array([this.fb.control('', [this.validateForm.isEmpty])]) // 默认一个
    })

    // + -
    this.groupDynamicForm = this.fb.group({
      name: ['', [Validators.required]],
      dynamicGroup: this.fb.group({})
    })
    this.addGroup()

    // 比较
    this.compareForm = this.fb.group({
      min: ['', [this.validateForm.isEmpty]],
      max: ['', [this.validateForm.isEmpty]],
    }, {
      validator: this.validateForm.compare('min', 'max')
    })
    // 条件
    this.conditionalForm = this.fb.group({
      name: ['', [this.validateForm.isEmpty]]
    })
  }
  ngOnChanges (change: SimpleChange) {
    // 针对@Input()
    console.log(change)
  }
  checkChange (event) {
    var e = event.target
    if (e.checked) {
      this.conditionalForm.controls['name'].setValidators([this.validateForm.isEmpty])
    } else {
      this.conditionalForm.controls['name'].clearValidators()
      // 可以令group验证更新下
      this.conditionalForm.controls['name'].updateValueAndValidity()
      // 清除验证
      this.conditionalForm.controls['name'].markAsUntouched({onlySelf: true})
      this.conditionalForm.controls['name'].markAsPristine()
    }
  }
  backData = [
    { key: 'name', name: '账号', value: '' },
    { key: 'pass', name: '密码', value: '' },
    { key: 'shengao', name: '身高', value: '' },
    { key: 'weight', name: '体重', value: '' },
    { key: 'birth', name: '出生地', value: '' },
  ]
  get cardDynamicForm(): FormArray {
    return this.dynamicForm.get('cardArray') as FormArray;
  }

  addDynamicForm(): void {
    console.log(this.dynamicForm.controls.cardArray)
    this.dynamicList.forEach(items => {
      // this.dynamicForm.controls.cardArray.addControl(
      //     items.id.toString(),
      //     new FormControl('', Validators.required)
      //   )
    })
  }
  addValidForm() {
    // 一般遍历不同的
    this.backData.forEach(items => {
      // 第一种写法
      // this.eachForm.setControl(items.key, new FormControl('', [Validators.required]))
      // 第二种写法
      // this.eachForm.addControl(items.key, new FormControl('', [Validators.required]))
      // 第三种写法
      this.eachForm.addControl(items.key, this.fb.control('', [Validators.required]))
    })
  }
  dynamicSubmit() {
    // this.markAsTouched(this.cardDynamicForm)
    // this.markAsTouched(this.dynamicForm)
    this.formMarkAsDirtyCallback(this.dynamicForm)
    if (this.dynamicForm.valid) {
      console.log(this.dynamicList)
      console.log(this.dynamicForm.value)
      alert('success')
    }
  }
  markAsTouched(group: FormGroup | FormArray) {
    group.markAsTouched({ onlySelf: true });
    Object.keys(group.controls).map((field) => {
      const control = group.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof FormGroup) {
        this.markAsTouched(control);
      }
    });
  }
  // 对整个表单递归校验
  formMarkAsDirtyCallback(form) {
    for (const key in form.controls) {
      if (form.controls.hasOwnProperty(key)) {
        form.controls[key].markAsDirty();
        form.controls[key].updateValueAndValidity();
        // 如果 controls.key 里面还有 controls，则子控件类型可能为 FormGroup 或者 FormArray
        if (form.controls[key].hasOwnProperty('controls')) {
          if (form.controls[key]['length']) {
            // 如果 controls.key.length 不是 undefined，则该控件为 FormArray
            const formArr = form.get(key) as FormArray;
            this.markAsTouched(formArr)
            // for (const formArrIndex in formArr.controls) {
            //   if (formArr.controls.hasOwnProperty(formArrIndex)) {
            //     // 标记 FormArray 里面的 control
            //     const element = formArr.controls[formArrIndex] as FormGroup;
            //     this.formMarkAsDirtyCallback(element);
            //   }
            // }
          } else {
            // 如果没有 controls.key.length 属性，则是 FormGroup 类型，此时重新循环校验
            this.formMarkAsDirtyCallback(form.controls[key]);
          }
        }
      }
    }
  }
  eachSubmit() {
    Object.keys(this.eachForm.controls).forEach(field => {
      const control = this.eachForm.get(field)
      control.markAsDirty({ onlySelf: true })
    });
    if (this.eachForm.invalid) {
      return
    }
    alert('success')
  }
  registorForm = this.fb.group({
    // account: ['', [this.validateForm.isEmpty], [this.existAccount()]], // 方法一
    account: ['', [this.validateForm.isEmpty], [this.existAccount1.bind(this)]], //  方法二
  },
    { updateOn: "submit" }
  )
  // 方法一 [this.existAccount()]
  existAccount() {
    return (control: AbstractControl) => {
      return this.service.getData(control.value).pipe(
        map(res => {
          if (control.value == '123') {
            return { message: '该用户已注册' }
          } else {
            return null
          }
        })
      )
    }
  }
  // 方法二 [this.existAccount1.bind(this)]
  existAccount1(control: AbstractControl):
    Promise<ValidationErrors | null> | Observable<ValidationErrors | null> {
    return this.service.getData(control.value).pipe(
      delay(4000),
      map(res => {
        if (control.value == '123') {
          return { message: '该用户已注册' }
        } else {
          return null
        }
      })
    )
  }
  submit() {
    Object.keys(this.registorForm.controls).forEach(field => {
      const control = this.registorForm.get(field)
      control.markAsDirty({ onlySelf: true })
      control.updateValueAndValidity(); // 作用
    });
  }
  private newStrikeScheduleItem(): FormControl {
    return this.fb.control('', [Validators.required]);
  }
  dynamicAdd() {
    console.log(this.dynamicForm.controls.cardArray)
    this.dynamicList.push({
      id: this.dynamicList.length.toString(),
      code: ''
    })
    this.cardDynamicForm.push(this.fb.control('', [this.validateForm.isEmpty]))
    // this.dynamicForm.controls.cardArray.controls.addControl()zfz
    // this.dynamicForm.controls.cardArray.addControl(
    //   this.dynamicList.length.toString(),
    //   new FormControl('', Validators.required)
    // )
  }
  dynamicReduce(i) {
    this.dynamicList.splice(i, 1)
    this.cardDynamicForm.removeAt(i)
  }
  get transferFormGroup() {
    return this.groupDynamicForm.get('dynamicGroup') as FormGroup;
  }
  addGroup() {
    let len = this.dynamicGroupList.length.toString()
    this.dynamicGroupList.push({
      id: len,
      code: ''
    })
    this.transferFormGroup.addControl(
      len,
      new FormGroup({
        id: new FormControl(len),
        code: this.fb.control('', [this.validateForm.isEmpty]),
      })
    )
    console.log(this.dynamicGroupList)
    console.log(this.transferFormGroup.controls[0])
  }
  removeGroup(i) {
    this.dynamicGroupList.splice(i, 1)
  }
  compareFormSubmit() {
    this.formMarkAsDirtyCallback(this.compareForm)
    if (this.compareForm.invalid) {
      return
    }
  }
  conditionalFormSubmit () {
    this.formMarkAsDirtyCallback(this.conditionalForm)
    if (this.conditionalForm.invalid) {
      return
    }
    alert('success')
  }
}
