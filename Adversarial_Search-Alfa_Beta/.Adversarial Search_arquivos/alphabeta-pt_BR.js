var $svg;
var $console;
var uuid = 0;

var tree;

var schedule = new Array();
var steps;
var step_index = 0;


// DATA TYPES
function Node(parent) {
    this.parent = parent;
    this.children = new Array();

    this.static_value;
   
    // display
    this.color = "#cba";
    this.highlighted = false;
    this.pruned = false;
    this.evaluated = false;
    this.hint = false;
    this.alpha = null;
    this.beta = null; 
    this.finished = false;
    // end display

    this.appendChild = function(child) {
	if(this.children.length > 0){
	    this.children[this.children.length-1].sibling = child;
	}
	this.children.push(child);
	child.parent = this;
	return this;
    };

    this.depth = function(){
	if(!this.parent){return 0;}
	return (this.parent.depth() + 1);
    }

    this.clone = function(down){
	if(this.parent && !down) {
	    var index = -1;
	    for(var i=0;i<this.parent.children.length;i++) {
		if(this.parent.children[i] == this) {
		    index = i;
		}
	    }
	    var x = this.parent.clone();
	    return x.children[index];
	}
	else{
	    var x = new Node(); 
	    x.alpha = this.alpha;
	    x.beta = this.beta;
	    x.finished = this.finished;
	    x.label = this.label;
	    x.color = this.color;
	    x.static_value = this.static_value;
	    x.evaluated = this.evaluated;
	    x.highlighted = this.highlighted;
	    x.pruned = this.pruned;
	    x.hint = this.hint;
	    for(var i=0;i<this.children.length;i++) {
		x.appendChild(this.children[i].clone(true));
	    }
	    return x;
	}
    }

    this.find = function(label, down) {
	if(this.parent && !down) {
	    this.parent.find(label, down);
	}
	else {
	    if(this.label == label){return this;}
	    for(var i=0;i<this.children.length;i++) {
		var y = this.children[i].find(label, true);
		if(y){return y}
	    }
	    return null;
	}
    }

    this.unhighlightAll = function(down) {
	if(this.parent && !down) {
	    this.parent.unhighlightAll();
	}
	else {
	    this.highlighted = false;
	    for(var i=0;i<this.children.length;i++) {
		this.children[i].unhighlightAll(true);
	    }
	}
    }

    this.unhintAll = function(down) {
	if(this.parent && !down) {
	    this.parent.unhintAll();
	}
	else {
	    this.hint = false;
	    for(var i=0;i<this.children.length;i++) {
		this.children[i].unhintAll(true);
	    }
	}
    }


    this.prune = function () {
	this.pruned = true;
	for(var i=0; i<this.children.length; i++) {
	    this.children[i].prune();
	}
    }


}


// TREE MANIPULATION
function label_tree(node) {
    var alphabet = new Array(),
        queue = new Array();
    
    queue.push(node);

    for (var n = 1 ; n <= 3; n++)
        for (var c = 'A'.charCodeAt(0); c < 'Z'.charCodeAt(0); c++)
            alphabet.push(String.fromCharCode(c)+String(n));
        
    

    while(queue.length > 0) {
    	var x = queue.shift();
    	for(var i=0;i<x.children.length;i++) {
    	    queue.push(x.children[i]);
    	}
    	x.label = alphabet.shift();
    }
}

function array_to_tree(arr) {
    // Make a tree out of a nested sequence of arrays.
    // Each array represents a level of the tree.
    // The array can either contain other arrays (for non-leaf nodes)
    // or a single number (a static value, for leaf nodes).

    var node = new Node();
    if(arr.length == 1 && !isNaN(arr[0])) {
	node.static_value = arr[0];
    }
    else {
	for(var i=0;i<arr.length;i++) {
	    node.appendChild(array_to_tree(arr[i]));
	}
    }

    return node;
}

function tree_to_string(tree) {
    var str = "";
    if(tree.static_value) {str += tree.static_value;}
    for(var i=0; i< tree.children.length; i++) {
	str = str += tree_to_string(tree.children[i]);
    }
    return "("+str+")";
}

function tree_to_string_indented(tree, indent) {
    if(typeof indent === "undefined"){indent = 0;}
    var str = "";
    if(tree.static_value) {str += tree.static_value;}
    for(var i=0; i< tree.children.length; i++) {
	str = str += tree_to_string_indented(tree.children[i], indent+1);
	if(i<tree.children.length-1) {
	    str = str + ", ";
	}
    }
    
    str = "["+str+"]";
    for(var i=0; i<indent;i++) {
	//str = "  "+str;
    }
    //str = "\n"+str;
    return str;
    
}

// LOGGING FUNCTION

function write_message($log, msg, depth) {
    //return $(msg).appendTo($log);
    //alert(depth);


    if(depth == 0) {
	uuid++;
	return $("<div/>").append(msg).appendTo($log).attr('id',uuid);
    }
    else {
	var x = $log.children();
	if($(x).length == 0 || !$(x).last().hasClass("nest")){
	    x = $("<div/>").addClass("nest").appendTo($log);
	}
	else {
	    x = x.last();
	}

	return write_message(x, msg, depth - 1);
    }
}


// ALPHA BETA FUNCTIONS 

function pretty_name(node) {
    return "<b>"+node.label+"</b>";
}
function pretty_print(num) {
    if(num == Number.POSITIVE_INFINITY){return "+&infin;";}
    if(num == Number.NEGATIVE_INFINITY){return "&#8722;&infin;";}
    return String(num);
}


function print_algorithm(debug,$log) {
    $log.html('');

    var f = function(x,n){
	debug.addLine(write_message($log, x, n));
    };
 
    f("<tt>Busca-Alpha-Beta</tt>(<tt>nó</tt>, <tt>maximizando?</tt>, &alpha;, &beta;, &alpha;<tt>-nó</tt>, &beta;<tt>-nó</tt>)", 0);
    f("Se &alpha; e &beta; não estão definidos:", 1);
    f("Defina o &alpha; = &#8722;&infin; e o &beta; = +&infin;.", 2);
    f("Se o <tt>nó</tt> tem filho:", 1);  
    f("Para cada filho <tt>FILHO</tt> de <tt>nó</tt>:", 2);
    f("Defina <tt>&langle;valor_do_resultado, nó_resultante&rangle;</tt> = <tt>Busca-Alpha-Beta</tt>(<tt>FILHO</tt>, NÃO <tt>maximizando?</tt>, &alpha;, &beta;, &alpha;<tt>-nó</tt>, &beta;<tt>-nó</tt>)", 3);
    f("Se <tt>maximizando?</tt>:", 3);
    f("Se <tt>valor_do_resultado</tt> > &alpha;:", 4);//f("Se <tt>resultado</tt> > &alpha;:", 4);
    f("Defina &langle;&alpha;, &alpha;<tt>-nó</tt>&rangle; = <tt>&langle;valor_do_resultado, nó_resultante&rangle;</tt>.", 5);
    f("Senão:", 3);
    f("Se <tt>valor_do_resultado</tt> < &beta;:", 4);
    f("Defina &langle;&beta;, &beta;<tt>-nó</tt>&rangle; = <tt>&langle;valor_do_resultado, nó_resultante&rangle;</tt>.", 5);
    f("Se &alpha; &geq; &beta;: <span class='comment'>// se o <tt>nó</tt> pode ser podado</span>", 3);
    f("Saia do loop antecipadamente.", 4);
    f("Fim do Para.", 2);
    f("Se <tt>maximizando?</tt>:", 2);
    f("Retorne &langle;&alpha;, &alpha;<tt>-nó</tt>&rangle;.", 3);
    f("Senão:", 2);
    f("Retorne &langle;&beta;, &beta;<tt>-nó</tt>&rangle;.", 3);
    f("Senão:", 1);
    f("Retorne o <tt>nó</tt> e o valor estático do <tt>nó</tt>.", 2);

    // f("<tt>Alpha-Beta-search</tt>(<tt>node</tt>, <tt>maximizing?</tt>, &alpha;, &beta;)", 0);
    // f("If &alpha; and &beta; are undefined:", 1);
    // f("Set &alpha; = &#8722;&infin; and &beta; = +&infin;.", 2);
    // f("If <tt>node</tt> has children:", 1);  
    // f("For each child <tt>child</tt> of <tt>node</tt>:", 2);
    // f("Set <tt>result</tt> = <tt>Alpha-Beta-search</tt>(<tt>child</tt>, not <tt>maximizing?</tt>, &alpha;, &beta;)", 3);
    // f("If <tt>maximizing?</tt>:", 3);
    // f("If <tt>result</tt> > &alpha;:", 4);
    // f("Set &alpha; = <tt>result</tt>.", 5);
    // f("Else:", 3);
    // f("If <tt>result</tt> < &beta;:", 4);
    // f("Set &beta; = <tt>result</tt>.", 5);
    // f("If &alpha; &geq; &beta;: <span class='comment'>// if <tt>node</tt> can be pruned</span>", 3);
    // f("Exit the for loop early.", 4);
    // f("End For.", 2);
    // f("If <tt>maximizing?</tt>:", 2);
    // f("Return &alpha;.", 3);
    // f("Else:", 2);
    // f("Return &beta;.", 3);
    // f("Else:", 1);
    // f("Return the static value of <tt>node</tt>.", 2);

}

function alpha_beta(debug, current_state, $log, node, is_maximizing, depth, 
		    alpha, alphaNode, beta, betaNode) {

    var f = function(msg, indent, lineno, commit) {
	var x = write_message($log, msg, depth+indent);
	if (!(typeof lineno === "undefined")){

	    debug.lineMap[$(x).attr('id')] = lineno;
	}
	if(true || commit) {
	    debug.stateMap[$(x).attr('id')] = current_state.clone();
	}
    };

    // If values for alpha and beta aren't provided,
    // set them to negative and positive infinity, respectively.
    var me = pretty_name(node);

    current_state.unhighlightAll();
    current_state.highlighted = true;


    if(typeof alpha === "undefined") {
	var alpha = Number.NEGATIVE_INFINITY;
	f("<span class='update'>Definindo &alpha; = &#8722;&infin;, por padrão.</span>", 0, 2,true);
    }
    if(typeof beta === "undefined") {
	var beta = Number.POSITIVE_INFINITY;
	f("<span class='update'>Definindo &beta; = +&infin;, por padrão.</span>", 0, 2, true);
    }

    current_state.alpha = alpha;
    current_state.beta = beta;

    f("<hr/>", 0);
    f("Visitando o nó "+me+". (vez do "+
		  (is_maximizing ? "MAX" : "MIN")+")<li/>", 0, 0,true);



    f("Nesse nó, o melhor resultado de MAX até agora é: &alpha; = " + pretty_print(alpha) + "", 0, 0, true ); 
    f("Nesse nó, o melhor resultado de MIN até agora é: &beta; = " + pretty_print(beta) + "", 0, 0, true); 

    // First of all, is this state a leaf node?

    for(var i=0;i<current_state.children.length;i++) {
	current_state.children[i].hint = true;
    }

    f("O "+ me + "  tem filhos?",  0, 3);

    if(node.children.length == 0) {

	f("<span class='answer'>Não; calcule seu valor (pontuação) usando a avaliação estática.</span>", 1,19,true);
	current_state.evaluated = true;
	f("Retorne este nó " + me + " e seu valor estático:&emsp;"+node.static_value+"", 1, 20,true);
	return {node:node, value:node.static_value, state: current_state};
    }
    else {


//	f("<span class='answer'>Yes: The score of this node is calculated by finding the best move that " + (is_maximizing ? "MAX" : "MIN") + " can make here&mdash;the child with the " + (is_maximizing ? "highest" : "lowest" ) + " score.</span>",1, 3);
	//f("<span class='answer'>Yes. For each child, calculate the best move that " + (is_maximizing ? "MIN" : "MAX") + " could make next turn if that option were taken. Then " + (is_maximizing ? "MAX" : "MIN") + " picks the move that gives the " + (is_maximizing ? "highest" : "lowest" ) + " score.</span>",1, 3);
//	f("<span class='answer'>Yes. To find " + (is_maximizing ? "MAX" : "MIN") + "'s best move, compute " + (is_maximizing ? "MIN" : "MAX") + "'s best response to each move and pick the one with the " + (is_maximizing ? "highest" : "lowest" ) + " score.", 1, 3);
	f("<span class='answer'>Sim. Para determinar qual movimento é melhor para o " + (is_maximizing ? "MAX" : "MIN") + ", calcule a melhor resposta de " + (is_maximizing ? "MIN" : "MAX") + " para cada um deles e escolha aquele que tem o " + (is_maximizing ? "maior" : "menor" ) + " valor (pontuação).", 1, 3);


// The best move for " + (is_maximizing ? "MAX" : "MIN") + " will be the child that gives the highest score given that " + (is_maximizing ? "MAX" : "MIN") + " MIN makes the best possible move. For each child, calculate the best move that " + (is_maximizing ? "MIN" : "MAX") + " could make next turn if that option were taken. Then " +  + " picks the move that gives the " + (is_maximizing ? "highest" : "lowest" ) + " score.</span>",1, 3);

	//f("<span class='answer'>Yes; " +
	//	      (is_maximizing ? "MAX" : "MIN") + " determines the score of this node by finding the child with the " + (is_maximizing ? "highest" : "lowest") + " score.</span>", 1);

	f("LOOP: Comece a aplicar recursivamente o alpha-beta ao filho de "+me+": [" +
		      node.children.map(pretty_name).join(", ")
		      + "].", 1, 4);

	// f("LOOP: Begin recursively applying alpha-beta to "+me+"'s children. Since it's " +
	// 	      (is_maximizing ? "MAX's" : "MIN's") + " turn, we will compare each returned result with " +
	// 	      (is_maximizing ? "&alpha;" : "&beta;") + ".", 1);
	




	for(var i=0; i<node.children.length; i++) {

	    var you = pretty_name(node.children[i]);


	    //f("~", 2);
	    current_state.unhintAll();
	    current_state.children[i].hint = true;
	    
	    f("&#x21B6 Aplique recursivamente o alpha-beta ao " + (i == 0 ? "primeiro" : "próximo") + " nó filho, "+you+". (com os argumentos &alpha;="+pretty_print(alpha)+", &beta;="+pretty_print(beta)+")", 2, 5-0);

	    var result = alpha_beta(debug, current_state.children[i], $log, node.children[i], 
	 			    !is_maximizing, 
	 			    depth+3, 
				    alpha, alphaNode, beta, betaNode);
	  
	    current_state = result.state.parent;
	    current_state.unhighlightAll();
	    current_state.highlighted = true;

	    current_state.children[i].hint = true;
	    f("&#x21bb; Volte para o nó pai " +me+" (vez do "+ (is_maximizing ? "MAX" : "MIN")+")<li/>",  2, 6-1, true);
	    
	    if(is_maximizing) {
		f("[MAX] O resultado retornado (= "+pretty_print(result.value)+") é maior que &alpha; (= "+pretty_print(alpha)+")?", 2, 7);
		if(result.value > alpha) {
		    f("<span class='answer'>Sim. Movimentar para " + pretty_name(result.node)+ " provê uma melhor pontuação (garantida) para MAX que qualquer outro movimento descoberto até agora.</span>", 3, 8);

		    current_state.alpha = result.value;
		    f("Atualize o valor para o melhor resultado de MAX, &alpha;. <span class='update'>Defina &alpha; = "+pretty_print(result.value)+", e lembre que o valor do nó " + pretty_name(result.node) + " continua com ele.</span>", 3, 8);
		    alpha = result.value;
		    alphaNode = result.node;
		}
		else {
		    f("<span class='answer'>Não.</span>", 3, 7);
		}
	    }
	    else {
		f("[MIN] O resultado retornado (= "+pretty_print(result.value)+") é menor que &beta; (= "+pretty_print(beta)+")?", 2, 10);
		//f("[MIN] Is the returned result smaller than &beta;? (Is "+pretty_print(result.value)+" smaller than "+pretty_print(beta)+"?)", 2);
		if(result.value < beta) {
		    f("<span class='answer'>Sim. Movimentar para " + pretty_name(result.node)+ " provê uma melhor pontuação (garantida) para o MAX que qualquer valor descoberto até agora.</span>", 3, 8);

//		    f("<span class='answer'>Yes. This move is a better guaranteed move for MIN than any move discovered so far.</span>", 3, 10);		    current_state.beta = result.value;
            current_state.beta = result.value;
		    f("Atualize o valor para o melhor resultado de MIN, &beta;. <span class='update'>Defina &beta; = "+pretty_print(result.value)+", e lembre que o valor do nó " + pretty_name(result.node)+" continua com ele.</span>", 3, 11);
		    beta = result.value;
		    betaNode = result.node;
		}
		else {
		    f("<span class='answer'>Não.</span>", 3,9);
		}
	    }


	    if( i+1 != node.children.length) {
		f("Nós podemos parar de olhar o resto dos filhos de " +me+ " (&alpha;&thinsp;&geq;&thinsp;&beta;)? (&alpha;="+pretty_print(alpha)+", &beta;="+pretty_print(beta)+")", 2, 12);
		if(alpha >= beta) {
		    f("<span class='answer'>Sim. O oponente de " + (is_maximizing ? "MAX" : "MIN" ) + " pode garantir um melhor resultado ("
				  + (is_maximizing ? "&beta; = " + pretty_print(beta) : "&alpha; = " + pretty_print(alpha) ) + " no nó "  
				   + (is_maximizing ? pretty_name(betaNode) : pretty_name(alphaNode)) + ") através de um movimento anterior diferente.</span>", 3);
		//f("<li class='answer'>Yes. " + (is_maximizing ? "MAX" : "MIN" ) + " can guarantee a better outcome by taking a different earlier move.", 3);
		    for(var j=i+1; j<node.children.length;j++) {
			current_state.children[j].prune();
		    }

		    f("Pare as iterações sobre os filhos &mdash; saia antecipadamente.", 3, 13, true);
		    break;
		}
		else {
		    f("<span class='answer'>Não, ainda pode existir um movimento melhor.</span>", 3, 12,true);
		}
	    }


	}

	current_state.unhintAll();
	if(!node.parent) {
	    var x = is_maximizing ? alphaNode : betaNode;
	    x = current_state.find(x.label);
	    while(x) {
		x.finished = true;
		x = x.parent;
	    }
	}

	f("Terminou a iteração sobre os filhos de " + me + ". Retorne a melhor opção de " + 
		      (is_maximizing ? "MAX" : "MIN") + ": "+
		      (is_maximizing ? "&alpha; = " + pretty_print(alpha) : "&beta; = " + pretty_print(beta) ) + " no nó " +  
		      (is_maximizing ? pretty_name(alphaNode) : pretty_name(betaNode)) + ".", 2, (is_maximizing ? 16 : 18) );
	if(is_maximizing) {
	    return {node:alphaNode, value:alpha, state:current_state};
	}
	else {
	    return {node:betaNode, value:beta, state:current_state};
	    
	}
    }




    
}



// TREE CUSTOMIZATION


function edit_tree() {
    if($(".editor").length > 0) {
	$(".editor").remove();
    }
    else {
	var $editor = $("<div/>", {class: 'editor'});
	var $area = $("<textarea/>",{rows: 12, cols: 40});
	var $btn = $("<input/>", {value: "Confirmar mudanças",type:'button'}).click(function() {
	    var x = $area.val();
	    x = x.replace(/[^\[\],0-9]/g,'');
	    var y = eval(x);
	    tree = array_to_tree(y);
	    init_tree(array_to_tree(y));
	    init_stepper();
	    $editor.remove();
	});

	$area.val(tree_to_string_indented(tree));
	$editor.append($area).append($btn).appendTo("body");
    }
}


// INTERACTIVITY FUNCTIONS

function lookit() {
    var x = $(steps).get(step_index);

    $(x).click();
    var offset = $(".console .highlight").first();
    offset = offset.offset();
   
    var n = step_index - 4; if(n < 0) {n = 0}

    $(steps).get(n).scrollIntoView();

    //$(".trace").html($("<div/>").append(x).html());

}
function init_stepper() {
    steps = $(".console div:not(.nest)");
    lookit();
}


/// DRAWING FUNCTIONS
function draw_tree($svg, tree, top, width, params)
{
    if(typeof params === "undefined") params = new Object();
    
    if(!tree.parent) $svg.clear();

    if(tree.parent && !params.down)
    {
        draw_tree($svg, tree.parent, top, width, params);
        return;
    }

    var lineSize = 60;
    var left = params.left == null ? width/2 : params.left;
    if(tree.children.length > 0)
    {
        var ww = width / tree.children.length;
        var d = (tree.children.length-1)/2;
        
        for(var i=0; i < tree.children.length; i++)
        {
            var x = left  + (i-d)*ww;
            var y = top + lineSize;

            $svg.line(left,top,x,y,{ stroke:'#ccc0c0' , strokeWidth:2});//'#ba9'

            params.left = x;
            params.down = true;

            if(tree.children[i].pruned)
            {
                var mx = (left + x) /2;
                var my = (top + y) /2;
                $svg.line(mx + 4,my-4,mx-4,my+4,{ stroke: '#000', strokeWidth:1});
            }

            draw_tree($svg, tree.children[i], y, ww, params);
        }
    }

    $svg.circle(left, top, 16, {fill: (tree.finished ? "#e0eeeeCC" : (tree.pruned ? "#aaa" : (tree.highlighted ? "#fcc" : "#eee0e0CC"))), 
                    stroke: (tree.finished ? "#0af" : (tree.highlighted ? '#d00' : (tree.hint ? "#0c0" : '#ccc0c0'))),
                    strokeWidth: (tree.highlighted || tree.hint || tree.finished ? 3: 1) });
    $svg.text(left - 14/4-4, top-14/4+1,
            String(tree.label),
            {fontFamily: "Helvetica",
            fontSize: 14,
            fontWeight: "bold",
            textAnchor: "center",
            fill : "#443"
            });

    if(tree.static_value)
    {
        var temp_l = String(tree.static_value).length;
        temp_l = (temp_l > 1)?temp_l*2:0;
        $svg.text(left - 14/4 - temp_l, top+14,
                String(tree.static_value),
                {fontFamily: "Helvetica",
                fontSize: 14,
                fontWeight: "normal",
                textAnchor: "center",
                fill : (tree.evaluated ? "#000" : "#aaa")
                });
    }
    tree.x = left;
    tree.y = top;

    if(tree.alpha != null)
    {
        var alpha = $("<div/>").html("&alpha; = "+pretty_print(tree.alpha)).html();
        var beta = $("<div/>").html("&beta; = "+pretty_print(tree.beta)).html();
        $svg.text(left, top-20,
                String(alpha+", "+beta),
                {fontFamily: "Helvetica",
                fontSize: 10,
                fontWeight: "normal",
                textAnchor: "center",
                fill : (tree.highlighted ? "#555" : "#ccc")
                });
    }

}



// SANDBOX
function init_tree(tree) {
    //var tree = 
    
    //var log = $("<ul/>"); // a place to put messages
    //$console.append(log);
    step_index = 0;

    label_tree(tree); 
    draw_tree($svg, tree, 50, 800); 

    var debug = new Object();
    debug.lines = new Array();
    debug.addLine = function(x) {
                        this.lines.push(x);
                        return x;
                    };
    debug.lineMap = new Object();

    debug.states = new Array();
    debug.stateMap = new Object();

    debug.commit = function(x) {
        this.states.push(x);
    };



    print_algorithm(debug, $(".algo"));
    $console.html('');
    alpha_beta(debug, tree.clone(), $console, tree, true, 0);

    $(".console div:not(.nest)").click(function() {
	var id = $(this).attr('id');
	if(id >= 0){
	    var n = debug.lineMap[id];
	    if(n >= 0) {
		$(".highlight").removeClass('highlight');
		$(debug.lines[n]).addClass('highlight');
		$(this).addClass("highlight");
	    }
	    
	    var x = debug.stateMap[id];
	    if(x) {
		draw_tree($svg, x, 50, 800);
	    }
	}

    });

}



$(window).resize(function() {
    $("#paper").svg().attr('width',$(window).width() - $(".algo").width() + 120);
    $("#paper").svg().attr('height',$(window).height()+10);
//    $("#paper").svg().css('margin', '-40px 0px 0px -100px');
});



$("body").ready(function(){



    $svg = $("#paper").svg().svg('get');
    $console = $(".console");
    
    tree = array_to_tree([[[[8],[5]],[[10]]],[[3],[6],[9]],[[10],[1],[7],[2]]]);
    init_tree(tree);
    init_stepper();
    
    

   $("#step-next").click(function() {
       
	if(step_index + 1 < steps.length){
	    step_index++;
	    if($($(steps).get(step_index)).text().length == 0) {
		$("#step-next").click();
	    }

	    lookit();
	}
	
    });

    $("#step-prev").click(function() {
	if(step_index > 0){
	    step_index--;
	    if($($(steps).get(step_index)).text().length == 0) {
		$("#step-prev").click();
		return;
	    }

	    lookit();
	}
	
    });

    $("#edit").click(function() {
	edit_tree();
    });

    $(window).resize();


    $("body").keydown(function(e){

	if(e.keyCode == 39 || e.keyCode == 40){
	    $("#step-next").click();
	    return;
	}

	if(e.keyCode == 37 || e.keyCode == 38){
	    $("#step-prev").click();
	    return;
	}

	
    });


});
