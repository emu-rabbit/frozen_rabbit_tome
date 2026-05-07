# 採掘師與園藝師技能列表

## 採掘師 (Miner)

| 等級 | ID | 技能名稱 | 英文名稱 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | 227 | **礦脈勘探** | Prospect | 能夠令礦脈及石場視覺化，導向地圖上也會顯示出來<If(Equal(PlayerParameter(68),16))><If(GreaterThanOrEqualTo(PlayerParameter(69),2))><br>轉職為採掘師之後會自動發動<Else/></If><Else/></If> |
| 3 | 228 | **大地勘查** | Lay of the Land | 感知自己附近能夠進行採集的礦脈及石場，導向地圖上也會顯示出來<br><UIForeground>F201F8</UIForeground><UIGlow>F201F9</UIGlow>發動條件：<UIGlow>01</UIGlow><UIForeground>01</UIForeground><UIForeground>F201F4</UIForeground><UIGlow>F201F5</UIGlow>礦脈勘探<UIGlow>01</UIGlow><UIForeground>01</UIForeground>效果中<br><UIForeground>F201F8</UIForeground><UIGlow>F201F9</UIGlow>持續時間：<UIGlow>01</UIGlow><UIForeground>01</UIForeground>15秒 |
| 4 | 235 | **敏銳視野** | Sharp Vision | 令獲得率提高5%<br>僅對獲得率高於1%的道具有效 |
| 5 | 237 | **敏銳視野II** | Sharp Vision II | 令獲得率提高15%<br>僅對獲得率高於1%的道具有效 |
| 5 | 291 | **大地勘查II** | Lay of the Land II | 感知自己附近能夠進行採集的最高級礦脈及石場，導向地圖上也會顯示出來<br><UIForeground>F201F8</UIForeground><UIGlow>F201F9</UIGlow>發動條件：<UIGlow>01</UIGlow><UIForeground>01</UIForeground><UIForeground>F201F4</UIForeground><UIGlow>F201F5</UIGlow>礦脈勘探<UIGlow>01</UIGlow><UIForeground>01</UIForeground>效果中<br><UIForeground>F201F8</UIForeground><UIGlow>F201F9</UIGlow>持續時間：<UIGlow>01</UIGlow><UIForeground>01</UIForeground>15秒 |
| 8 | 303 | **潛行** | Sneak | 輕聲行動，不會被最多高於自身等級4級的敵人襲擊 |
| 10 | 295 | **敏銳視野III** | Sharp Vision III | 令獲得率提高50%<br>僅對獲得率高於1%的道具有效 |
| 15 | 21177 | **富礦的饋贈I** | Mountaineer's Gift I | 額外採集獎勵發生率提升10%<br>僅對額外採集獎勵發生率高於1%的道具有效 |
| 20 | 280 | **十二神加護** | the Twelve's Bounty | 碎晶<If(GreaterThanOrEqualTo(PlayerParameter(68),16))><If(GreaterThanOrEqualTo(PlayerParameter(69),50))>、水晶、晶簇<Else/><If(GreaterThanOrEqualTo(PlayerParameter(69),41))>、水晶<Else/></If></If><Else/></If>的獲得數增加<If(GreaterThanOrEqualTo(PlayerParameter(69),71))>3<Else/>2</If><br><UIForeground>F201F8</UIForeground><UIGlow>F201F9</UIGlow>發動條件：<UIGlow>01</UIGlow><UIForeground>01</UIForeground>採集場所存在對應道具 |
| 23 | 4072 | **明晰視野** | Clear Vision | 令下一次採集的獲得率提高15%<br>僅對獲得率高於1%的道具有效 |
| 24 | 4073 | **高產** | Bountiful Yield | 令下一次採集的獲得數增加1個 |
| 25 | 232 | **石工之理** | Solid Reason | 恢復1次採集次數/恢復1點耐久<If(Equal(PlayerParameter(68),16))><If(GreaterThanOrEqualTo(PlayerParameter(69),90))><br><UIForeground>F201F8</UIForeground><UIGlow>F201F9</UIGlow>追加效果：<UIGlow>01</UIGlow><UIForeground>01</UIForeground>50%機率附加<UIForeground>F201F4</UIForeground><UIGlow>F201F5</UIGlow>理智同興預備<UIGlow>01</UIGlow><UIForeground>01</UIForeground>狀態<Else/></If><Else/></If> |
| 30 | 239 | **莫非王土** | King's Yield | 令獲得數增加1個 |
| 40 | 241 | **莫非王土II** | King's Yield II | 令獲得數增加2個 |
| 46 | 238 | **山岳之相** | Truth of Mountains | 發現未知的、傳說的、夢幻的礦脈與石場，導向地圖上也會顯示出來 |
| 50 | 240 | **收藏品採集** | Collect | 以當前的收藏價值採集1個收藏品<br>消耗1點耐久 |
| 50 | 22182 | **提煉** | Scour | 除去不純物質，使採集品的收藏價值上升<br>收藏價值上升量：獲得力越高，上升的越多<br>消耗1點耐久 |
| 50 | 22183 | **大膽提煉** | Brazen Prospector | 除去不純物質，使採集品的收藏價值上升<br>收藏價值上升量：提煉的50%～150%（隨機）<br>消耗1點耐久 |
| 50 | 22184 | **慎重提煉** | Meticulous Prospector | 除去不純物質，使採集品的收藏價值上升<br>收藏價值上升量：提煉的75%<br>消耗1點耐久<br>（有時也會不消耗耐久，獲得力越高機率越大） |
| 50 | 22185 | **集中檢查** | Scrutiny | 下次使用提煉技能時，可以提高收藏價值的上升量<br>鑑別力越高，提高的越多 |
| 50 | 25589 | **富礦的饋贈II** | Mountaineer's Gift II | 額外採集獎勵發生率提升30%<br>僅對額外採集獎勵發生率高於1%的道具有效<br>可以與富礦的饋贈I並用 |
| 55 | 4081 | **登山者的眼力** | Luck of the Mountaineer | 令隱藏道具強制出現 |
| 68 | 272 | **高產II** | Bountiful Yield II | 令下一次採集的獲得數增加<br>獲得力影響獲得數的增加量（最小1～最大3） |
| 74 | 4589 | **大地恩惠** | The Giving Land | 隨機增加碎晶、水晶、晶簇的獲得數<br>可以與十二神加護並用<br><UIForeground>F201F8</UIForeground><UIGlow>F201F9</UIGlow>發動條件：<UIGlow>01</UIGlow><UIForeground>01</UIForeground>採集場所存在對應道具 |
| 81 | 21203 | **納爾札爾福音** | Nald'thal's Tidings | 額外採集獎勵發生時的獲得數增加1個 |
| 85 | 21205 | **價值矚目** | Collector's Focus | 下一次使用提煉技能時，價值提升的發生率提高1.75倍 |
| 90 | 26521 | **理智同興** | Wise to the World | 恢復1次採集次數/恢復1點耐久<br><UIForeground>F201F8</UIForeground><UIGlow>F201F9</UIGlow>發動條件：<UIGlow>01</UIGlow><UIForeground>01</UIForeground><UIForeground>F201F4</UIForeground><UIGlow>F201F5</UIGlow>理智同興預備<UIGlow>01</UIGlow><UIForeground>01</UIForeground>狀態中 |
| 95 | 34871 | **預備碰觸** | Priming Touch | 下一次使用慎重提煉時，慎重提煉不消耗耐久的機率翻倍<br>此技能對採集地點的特殊效果<If(Equal(PlayerParameter(68),16))><If(GreaterThanOrEqualTo(PlayerParameter(69),100))>或強化洞察<Else/></If><Else/></If>所提升的機率無效 |

## 園藝師 (Botanist)

| 等級 | ID | 技能名稱 | 英文名稱 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | 210 | **三角測量** | Triangulate | 能夠令良材及草場視覺化，導向地圖上也會顯示出來<If(Equal(PlayerParameter(68),17))><If(GreaterThanOrEqualTo(PlayerParameter(69),2))><br>轉職為園藝師之後會自動發動<Else/></If><Else/></If> |
| 3 | 211 | **樹木之聲** | Arbor Call | 感知自己附近能夠進行採集的良材及草場，導向地圖上也會顯示出來<br><UIForeground>F201F8</UIForeground><UIGlow>F201F9</UIGlow>發動條件：<UIGlow>01</UIGlow><UIForeground>01</UIForeground><UIForeground>F201F4</UIForeground><UIGlow>F201F5</UIGlow>三角測量<UIGlow>01</UIGlow><UIForeground>01</UIForeground>效果中<br><UIForeground>F201F8</UIForeground><UIGlow>F201F9</UIGlow>持續時間：<UIGlow>01</UIGlow><UIForeground>01</UIForeground>15秒 |
| 4 | 218 | **環境探知** | Field Mastery | 令獲得率提高5%<br>僅對獲得率高於1%的道具有效 |
| 5 | 220 | **環境探知II** | Field Mastery II | 令獲得率提高15%<br>僅對獲得率高於1%的道具有效 |
| 5 | 290 | **樹木之聲II** | Arbor Call II | 感知自己附近能夠進行採集的最高級良材及草場，導向地圖上也會顯示出來<br><UIForeground>F201F8</UIForeground><UIGlow>F201F9</UIGlow>發動條件：<UIGlow>01</UIGlow><UIForeground>01</UIForeground><UIForeground>F201F4</UIForeground><UIGlow>F201F5</UIGlow>三角測量<UIGlow>01</UIGlow><UIForeground>01</UIForeground>效果中<br><UIForeground>F201F8</UIForeground><UIGlow>F201F9</UIGlow>持續時間：<UIGlow>01</UIGlow><UIForeground>01</UIForeground>15秒 |
| 8 | 303 | **潛行** | Sneak | 輕聲行動，不會被最多高於自身等級4級的敵人襲擊 |
| 10 | 294 | **環境探知III** | Field Mastery III | 令獲得率提高50%<br>僅對獲得率高於1%的道具有效 |
| 15 | 21178 | **沃土的饋贈I** | Pioneer's Gift I | 額外採集獎勵發生率提升10%<br>僅對額外採集獎勵發生率高於1%的道具有效 |
| 20 | 280 | **十二神加護** | the Twelve's Bounty | 碎晶<If(GreaterThanOrEqualTo(PlayerParameter(68),16))><If(GreaterThanOrEqualTo(PlayerParameter(69),50))>、水晶、晶簇<Else/><If(GreaterThanOrEqualTo(PlayerParameter(69),41))>、水晶<Else/></If></If><Else/></If>的獲得數增加<If(GreaterThanOrEqualTo(PlayerParameter(69),71))>3<Else/>2</If><br><UIForeground>F201F8</UIForeground><UIGlow>F201F9</UIGlow>發動條件：<UIGlow>01</UIGlow><UIForeground>01</UIForeground>採集場所存在對應道具 |
| 23 | 4086 | **植被專精** | Flora Mastery | 令下一次採集的獲得率提高15%<br>僅對獲得率高於1%的道具有效 |
| 24 | 4087 | **豐收** | Bountiful Harvest | 令下一次採集的獲得數增加1個 |
| 25 | 215 | **農夫之智** | Ageless Words | 恢復1次採集次數/恢復1點耐久<If(Equal(PlayerParameter(68),17))><If(GreaterThanOrEqualTo(PlayerParameter(69),90))><br><UIForeground>F201F8</UIForeground><UIGlow>F201F9</UIGlow>追加效果：<UIGlow>01</UIGlow><UIForeground>01</UIForeground>50%機率附加<UIForeground>F201F4</UIForeground><UIGlow>F201F5</UIGlow>理智同興預備<UIGlow>01</UIGlow><UIForeground>01</UIForeground>狀態<Else/></If><Else/></If> |
| 30 | 222 | **天賜收成** | Blessed Harvest | 令獲得數增加1個 |
| 40 | 224 | **天賜收成II** | Blessed Harvest II | 令獲得數增加2個 |
| 46 | 221 | **叢林之相** | Truth of Forests | 發現未知的、傳說的、夢幻的良材與草場，導向地圖上也會顯示出來 |
| 50 | 240 | **收藏品採集** | Collect | 以當前的收藏價值採集1個收藏品<br>消耗1點耐久 |
| 50 | 22182 | **提煉** | Scour | 除去不純物質，使採集品的收藏價值上升<br>收藏價值上升量：獲得力越高，上升的越多<br>消耗1點耐久 |
| 50 | 22187 | **大膽提煉** | Brazen Woodsman | 除去不純物質，使採集品的收藏價值上升<br>收藏價值上升量：提煉的50%～150%（隨機）<br>消耗1點耐久 |
| 50 | 22188 | **慎重提煉** | Meticulous Woodsman | 除去不純物質，使採集品的收藏價值上升<br>收藏價值上升量：提煉的75%<br>消耗1點耐久<br>（有時也會不消耗耐久，獲得力越高機率越大） |
| 50 | 22189 | **集中檢查** | Scrutiny | 下次使用提煉技能時，可以提高收藏價值的上升量<br>鑑別力越高，提高的越多 |
| 50 | 25590 | **沃土的饋贈II** | Pioneer's Gift II | 額外採集獎勵發生率提升30%<br>僅對額外採集獎勵發生率高於1%的道具有效<br>可以與沃土的饋贈I並用 |
| 55 | 4095 | **開拓者的眼力** | Luck of the Pioneer | 令隱藏道具強制出現 |
| 68 | 273 | **豐收II** | Bountiful Harvest II | 令下一次採集的獲得數增加<br>獲得力影響獲得數的增加量（最小1～最大3） |
| 74 | 4589 | **大地恩惠** | The Giving Land | 隨機增加碎晶、水晶、晶簇的獲得數<br>可以與十二神加護並用<br><UIForeground>F201F8</UIForeground><UIGlow>F201F9</UIGlow>發動條件：<UIGlow>01</UIGlow><UIForeground>01</UIForeground>採集場所存在對應道具 |
| 81 | 21204 | **諾菲卡福音** | Nophica's Tidings | 額外採集獎勵發生時的獲得數增加1個 |
| 85 | 21205 | **價值矚目** | Collector's Focus | 下一次使用提煉技能時，價值提升的發生率提高1.75倍 |
| 90 | 26521 | **理智同興** | Wise to the World | 恢復1次採集次數/恢復1點耐久<br><UIForeground>F201F8</UIForeground><UIGlow>F201F9</UIGlow>發動條件：<UIGlow>01</UIGlow><UIForeground>01</UIForeground><UIForeground>F201F4</UIForeground><UIGlow>F201F5</UIGlow>理智同興預備<UIGlow>01</UIGlow><UIForeground>01</UIForeground>狀態中 |
| 95 | 34871 | **預備碰觸** | Priming Touch | 下一次使用慎重提煉時，慎重提煉不消耗耐久的機率翻倍<br>此技能對採集地點的特殊效果<If(Equal(PlayerParameter(68),16))><If(GreaterThanOrEqualTo(PlayerParameter(69),100))>或強化洞察<Else/></If><Else/></If>所提升的機率無效 |
