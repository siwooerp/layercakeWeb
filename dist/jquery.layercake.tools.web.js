/********************
 * layercake
 * 移动端 JS工具集
 * 因为是内容使用，不保证通用
 * Created by 程旭 on 15/11/19.
 */
;
(function ($, window, document, undefined) {
    'use strict';

    /************
     * 绑定键值改变监控
     * jQuery 事件valuechange
     * @type {{teardown: Function, handler: Function, add: Function, triggerChanged: Function}}
     */
    $.event.special.valuechange = {
        teardown: function (namespaces) {
            $(this).unbind('.valuechange');
        },
        handler: function (e) {
            $.event.special.valuechange.triggerChanged($(this));
        },
        add: function (obj) {
            $(this).on('keyup.valuechange cut.valuechange paste.valuechange input.valuechange', obj.selector, $.event.special.valuechange.handler)
        },
        triggerChanged: function (element) {
            var current = element[0].contentEditable === 'true' ? element.html() : element.val()
                , previous = typeof element.data('previous') === 'undefined' ? element[0].defaultValue : element.data('previous');
            if (current !== previous) {
                element.trigger('valuechange', [element.data('previous')]);
                element.data('previous', current);
            }
        }
    };

    // 工具对象
    var tools = {
        isJSON: function (opt) {
            return typeof(opt) === "object" && Object.prototype.toString.call(opt).toLowerCase() && !opt.length;
        },
        isFunction: function (opt) {
            return ({}).toString.call(opt) === "[object Function]";
        },
        isString: function (opt) {
            return typeof opt === 'string';
        },
        isArray: function (opt) {
            return opt instanceof Array;
        },
        jsonStringify: function (opt) {
            return opt === undefined || typeof opt === "function" ? '' : JSON.stringify(opt);
        },
        jsonParse: function (opt) {
            return !opt || typeof opt === 'undefined' ? '' : JSON.parse(opt);
        }
    };

    $.SW = {
        /*******************
         * 数据本地存储
         * $.SW.storage.storage 是否支持存储
         * $.SW.storage.set('key', {id:1, name:'成功'}); // 设置数据 相同的key就是替换
         * $.SW.storage.add('key', {id:1, name:'成功'}); // 添加数据，返回的是个数组[{},{},'',{}]
         * $.SW.storage.get('key'); // 获取数据
         * $.SW.storage.clear(optName); // 清除所有数据 当填入optName时，只清除optName的数据
         * http://www.html-js.com/article/2635
         */
        storage: {
            storage: !!window.localStorage,
            set: function (optName, options) {
                localStorage.setItem(optName, tools.stringify(options));
                return this;
            },
            add: function (optName, options) {
                if (typeof options !== 'undefined') {
                    var opts = this.get(optName) || [];
                    opts.push(options);
                    this.set(optName, opts);
                }
                return this;
            },
            get: function (optName) {
                return tools.parse(localStorage.getItem(optName));
            },
            clear: function (optName) {
                if (typeof optName !== 'undefined') {
                    localStorage.removeItem(optName);
                } else {
                    localStorage.clear();
                }
                return this;
            }
        },
        /*****************
         * 数字格式化
         * console.log('add', $.SW.NUM.add(13.2, 13.333333333333));
         * console.log('sub', $.SW.NUM.sub(13.333333333, 12.3333));
         * console.log('mul', $.SW.NUM.mul(13.333333333, 12.3333));
         * console.log('div', $.SW.NUM.div(13.333333333, 12.3333));
         * console.log('toDecimal', $.SW.NUM.toDecimal('17%'));
         * console.log('toPercentFormat', $.SW.NUM.toPercentFormat(0.17));
         */
        NUM: {
            add: function (arg1, arg2) {
                var r1, r2, m;
                try {
                    r1 = arg1.toString().split(".")[1].length;
                } catch (e) {
                    r1 = 0;
                }
                try {
                    r2 = arg2.toString().split(".")[1].length;
                } catch (e) {
                    r2 = 0;
                }
                m = Math.pow(10, Math.max(r1, r2));
                return (this.mul(arg1, m) + this.mul(arg2, m)) / m;
            },
            sub: function (arg1, arg2) {
                return this.add(arg1, -arg2);
            },
            mul: function (arg1, arg2) {
                var m = 0, s1 = arg1.toString(), s2 = arg2.toString();
                try {
                    m += s1.split(".")[1].length;
                } catch (e) {
                }
                try {
                    m += s2.split(".")[1].length;
                } catch (e) {
                }
                return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m);
            },
            div: function (arg1, arg2) {
                var t1 = 0, t2 = 0, r1, r2;
                try {
                    t1 = arg1.toString().split(".")[1].length;
                } catch (e) {
                }
                try {
                    t2 = arg2.toString().split(".")[1].length;
                } catch (e) {
                }
                r1 = Number(arg1.toString().replace(".", ""));
                r2 = Number(arg2.toString().replace(".", ""));
                return (r1 / r2) * Math.pow(10, t2 - t1);
            },
            /****
             * 转化成小数, 原函数 toDecimal(datavalue) 存在的精度问题，因涉及过多屏蔽。
             * @param datevalue
             * @returns {*}
             */
            toDecimal: function (datevalue) {
                if (datevalue.indexOf('%') != -1) {
                    datevalue = datevalue.replace(/%/g, '');
                    if (datevalue.indexOf(',') != -1) {
                        datevalue = datevalue.replace(/,/g, '');
                    }
                    // 除100精度在原有基础上增加2位。
                    var decimal = (datevalue.indexOf('.') == -1) ? 0 : (datevalue.length - datevalue.indexOf('.') - 1);
                    datevalue = this.div(datevalue, 100).toFixed(decimal + 2);
                } else {
                    if (datevalue.indexOf(',') != -1) {
                        datevalue = datevalue.replace(/,/g, '');
                    }
                }
                return datevalue;
            },
            /*****
             * 小数 转 百分比%
             * @param datevalue
             * @returns {string}
             */
            toPercentFormat: function (datevalue) {
                var aa = this.mul(datevalue, 100);
                return "" + aa + "%";
            }
        }
    };


    /*************************
     * layercake 数据格式化处理
     * @param options
     * @returns {*}
     */
    $.fn.from = function (options) {

        /***************
         * type 值参数
         * 0    显示键值
         * 1    内显示值
         * 2    输入框
         * 3    单选
         * 4    打开、关闭
         * 5    多选
         * 6    进入下一页
         * 7    多行输入
         * 8    图片、多媒体
         * 9    添加数据
         * 10   时间插件
         * 11   下拉
         * 12   删除
         * */

        return this.each(function (options) {
            var me = this;
            me.opt = $.extend({}, {
                parent: [],                 // 父类列表
                self: '',                   // 当前页面jquery对象
                format: {},
                parentFn: null

            }, options);

        });

    };

})(window.jQuery, window, document);